
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { pool, query } = require("../../config/db");
const { signAccessToken, signRefreshToken } = require("../../utils/jwt");

async function loginService({ email, password }) {
  const rows = await query(
    `SELECT id, name, email, password_hash, role, is_active
     FROM users
     WHERE email = ? LIMIT 1`,
    [email]
  );

  const user = rows[0];

  if (!user || !user.is_active) {
    const error = new Error("Credenciales inválidas");
    error.status = 401;
    throw error;
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    const error = new Error("Credenciales inválidas");
    error.status = 401;
    throw error;
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  return {
    user: payload,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
}

async function registerUserByAdminService({ name, email, password, role, grupo_sas_id, cycle_start_date, initial_week_type }) {
  const existing = await query(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [email]
  );

  if (existing.length) {
    const error = new Error("El email ya existe");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, grupo_sas_id, cycle_start_date, initial_week_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, passwordHash, role, grupo_sas_id || null, cycle_start_date || null, initial_week_type || "A"]
  );

  return {
    id: result.insertId,
    name,
    email,
    role,
    grupo_sas_id: grupo_sas_id || null,
    cycle_start_date: cycle_start_date || null,
    initial_week_type: initial_week_type || "A"
  };
}

async function setPinService(userId, pin) {
  const pinHash = await bcrypt.hash(pin, 10);

  await query(
    `UPDATE users SET pin_hash = ? WHERE id = ?`,
    [pinHash, userId]
  );

  return { ok: true };
}

async function validatePinService(userId, pin) {
  const rows = await query(
    `SELECT pin_hash FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  const user = rows[0];

  if (!user?.pin_hash) {
    const error = new Error("PIN no configurado");
    error.status = 400;
    throw error;
  }

  const valid = await bcrypt.compare(pin, user.pin_hash);

  if (!valid) {
    const error = new Error("PIN inválido");
    error.status = 401;
    throw error;
  }

  return { ok: true };
}

async function forgotPasswordService(email) {
  const rows = await query(
    `SELECT id, email FROM users WHERE email = ? LIMIT 1`,
    [email]
  );

  if (!rows.length) {
    return { ok: true };
  }

  const user = rows[0];

  await query(
    `UPDATE password_resets SET used_at = NOW()
     WHERE user_id = ? AND used_at IS NULL`,
    [user.id]
  );

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await query(
    `INSERT INTO password_resets (user_id, token, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, tokenHash, expiresAt]
  );

  return { ok: true, token: rawToken };
}

async function resetPasswordService(token, newPassword) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const rows = await query(
    `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
     FROM password_resets pr
     WHERE pr.token = ?
     LIMIT 1`,
    [tokenHash]
  );

  const reset = rows[0];

  if (!reset || reset.used_at || new Date(reset.expires_at) < new Date()) {
    const error = new Error("Token inválido o expirado");
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
      [passwordHash, reset.user_id]
    );
    await conn.execute(
      `UPDATE password_resets SET used_at = NOW() WHERE id = ?`,
      [reset.id]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return { ok: true };
}

async function pinStatusService(userId) {
  const rows = await query(
    `SELECT pin_hash IS NOT NULL AS hasPIN FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  return { hasPIN: rows[0]?.hasPIN === 1 };
}

module.exports = {
  loginService,
  registerUserByAdminService,
  setPinService,
  validatePinService,
  forgotPasswordService,
  resetPasswordService,
  pinStatusService
};

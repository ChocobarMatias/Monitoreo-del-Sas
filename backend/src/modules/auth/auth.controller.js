// Controladores HTTP
 async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginService({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

 async function registerUserByAdminController(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const result = await registerUserByAdminService({ name, email, password, role });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function setPinController(req, res, next) {
  try {
    const { pin } = req.body;
    const result = await setPinService(req.user.id, pin);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function validatePinController(req, res, next) {
  try {
    const { pin } = req.body;
    const result = await validatePinService(req.user.id, pin);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

 async function forgotPasswordController(req, res, next) {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { query } = require("../../config/db");
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

async function registerUserByAdminService({ name, email, password, role }) {
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
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, role]
  );

  return {
    id: result.insertId,
    name,
    email,
    role
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
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await query(
    `INSERT INTO password_resets (user_id, token, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, rawToken, expiresAt]
  );

  return { ok: true, token: rawToken };
}

module.exports = { loginController, registerUserByAdminController, setPinController, validatePinController, forgotPasswordController };
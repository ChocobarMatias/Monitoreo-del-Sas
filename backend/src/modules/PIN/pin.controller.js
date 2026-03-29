
const bcrypt = require("bcrypt");
const { query } = require("../../config/db");

async function pinMiddleware(req, res, next) {
  const { pin } = req.headers;

  if (!pin) {
    return res.status(401).json({ ok: false, message: "PIN requerido" });
  }

  const rows = await query(
    `SELECT pin_hash FROM users WHERE id = ?`,
    [req.user.id]
  );

  const valid = await bcrypt.compare(pin, rows[0].pin_hash);

  if (!valid) {
    return res.status(403).json({ ok: false, message: "PIN inválido" });
  }

  next();
}

module.exports = { pinMiddleware };
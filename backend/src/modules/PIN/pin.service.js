
const bcrypt = require("bcrypt");
const { query } = require("../../config/db");

async function setPinService(userId, pin) {
  const hash = await bcrypt.hash(pin, 10);
  await query(`UPDATE users SET pin_hash = ? WHERE id = ?`, [hash, userId]);
  return { ok: true };
}

module.exports = { setPinService };

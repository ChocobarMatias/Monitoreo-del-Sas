
const crypto = require("crypto");
const bcrypt = require("bcrypt");

async function createApiKeyService(userId, name) {
  const rawKey = crypto.randomBytes(32).toString("hex");
  const hash = await bcrypt.hash(rawKey, 10);

  await query(
    `INSERT INTO api_keys (user_id, key_hash, name)
     VALUES (?, ?, ?)`,
    [userId, hash, name]
  );

  return rawKey;
}

module.exports = { createApiKeyService };
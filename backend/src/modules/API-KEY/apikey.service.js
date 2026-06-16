const crypto = require("crypto");
const { query } = require("../../config/db");

function hashApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

async function createApiKeyService(userId, name) {
  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = hashApiKey(rawKey);

  await query(
    `INSERT INTO api_keys (user_id, key_hash, name) VALUES (?, ?, ?)`,
    [userId, keyHash, name]
  );

  return rawKey;
}

async function validateApiKeyService(rawKey) {
  const keyHash = hashApiKey(rawKey);

  const rows = await query(
    `SELECT user_id FROM api_keys WHERE key_hash = ? LIMIT 1`,
    [keyHash]
  );

  return rows[0] ?? null;
}

module.exports = { createApiKeyService, validateApiKeyService };

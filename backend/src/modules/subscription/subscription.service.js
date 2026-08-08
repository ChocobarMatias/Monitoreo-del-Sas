const { query } = require("../../config/db");
const { env } = require("../../config/env");

async function getStatusService(userId) {
  const rows = await query(
    `SELECT MAX(expires_at) AS expires_at FROM subscriptions WHERE user_id = ?`,
    [userId]
  );

  const expiresAt = rows[0]?.expires_at;
  if (!expiresAt) return { status: "never", expires_at: null, remaining_days: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return { status: "expired", expires_at: expiresAt, remaining_days: 0 };

  const remainingDays = Math.round((expiry - today) / (1000 * 60 * 60 * 24));
  return { status: "active", expires_at: expiresAt, remaining_days: remainingDays };
}

async function getHistoryService(userId) {
  return query(
    `SELECT s.id, s.activated_at, s.expires_at, s.notes, s.created_at,
            u.name AS activated_by_name
     FROM subscriptions s
     LEFT JOIN users u ON u.id = s.activated_by
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
    [userId]
  );
}

async function activateSubscriptionService(userId, adminId, { activated_at, expires_at, notes }) {
  if (!activated_at || !expires_at) {
    throw Object.assign(new Error("activated_at y expires_at son requeridos"), { status: 400 });
  }
  await query(
    `INSERT INTO subscriptions (user_id, activated_at, expires_at, activated_by, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, activated_at, expires_at, adminId, notes || null]
  );
  return { ok: true };
}

function getAliasService() {
  return { alias: env.PAYMENT_ALIAS };
}

module.exports = {
  getStatusService,
  getHistoryService,
  activateSubscriptionService,
  getAliasService,
};

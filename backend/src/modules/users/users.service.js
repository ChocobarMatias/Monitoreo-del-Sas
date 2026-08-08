const { query } = require("../../config/db");

async function listUsersService() {
  return query(
    `SELECT u.id, u.name, u.email, u.role, u.is_active,
            u.cycle_start_date, u.initial_week_type, u.grupo_sas_id,
            g.nome AS grupo_nombre, g.tipo_inicio AS grupo_tipo_inicio,
            s.expires_at AS sub_expires_at,
            CASE
              WHEN s.expires_at IS NULL       THEN 'never'
              WHEN s.expires_at < CURDATE()   THEN 'expired'
              ELSE 'active'
            END AS sub_status,
            GREATEST(0, DATEDIFF(s.expires_at, CURDATE())) AS sub_remaining_days
     FROM users u
     LEFT JOIN grupos_sas g ON g.id = u.grupo_sas_id
     LEFT JOIN (
       SELECT user_id, MAX(expires_at) AS expires_at
       FROM subscriptions
       GROUP BY user_id
     ) s ON s.user_id = u.id
     ORDER BY u.name ASC`
  );
}

async function updateUserService({ id, name, email, role, is_active, cycle_start_date, initial_week_type, grupo_sas_id }) {
  await query(
    `UPDATE users
     SET name = ?, email = ?, role = ?, is_active = ?,
         cycle_start_date = ?, initial_week_type = ?, grupo_sas_id = ?
     WHERE id = ?`,
    [name, email, role, is_active ? 1 : 0, cycle_start_date || null, initial_week_type || "A", grupo_sas_id || null, id]
  );

  const rows = await query(
    `SELECT u.id, u.name, u.email, u.role, u.is_active,
            u.cycle_start_date, u.initial_week_type, u.grupo_sas_id,
            g.nombre AS grupo_nombre
     FROM users u
     LEFT JOIN grupos_sas g ON g.id = u.grupo_sas_id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listGruposService() {
  return query(
    `SELECT id, nombre, tipo_inicio, cycle_start_date, descripcion FROM grupos_sas ORDER BY id ASC`
  );
}

module.exports = { listUsersService, updateUserService, listGruposService };

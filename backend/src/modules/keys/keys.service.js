
const { query } = require("../../config/db");

const KEY_FIELDS = [
  "nombre", "mec1", "mec2", "mec3", "mec4", "mec5", "mec6",
  "vol", "back1", "back2", "descripcion", "guardia1", "guardia2",
  "telefono_guardia1", "telefono_guardia2", "fecha_actualizacion"
];

async function listKeysService() {
  const rows = await query("SELECT * FROM key_records ORDER BY id DESC");
  return rows;
}

async function createKeyService(data) {
  const fields = [
    "nombre", "mec1", "mec2", "mec3", "mec4", "mec5", "mec6",
    "vol", "back1", "back2", "descripcion", "guardia1", "guardia2"
  ];
  const values = fields.map(f => data[f] || null);
  const result = await query(
    `INSERT INTO key_records (${fields.join(",")}) VALUES (${fields.map(_ => "?").join(",")})`,
    values
  );
  return { id: result.insertId };
}

async function updateKeyService(id, data) {
  const fields = KEY_FIELDS.filter(f => f in data);
  if (fields.length === 0) return { updated: 0 };
  const values = fields.map(f => data[f] || null);
  values.push(id);
  const result = await query(
    `UPDATE key_records SET ${fields.map(f => `${f}=?`).join(",")} WHERE id=?`,
    values
  );
  return { updated: result.affectedRows };
}

async function deleteKeyService(id) {
  const result = await query("DELETE FROM key_records WHERE id=?", [id]);
  return { deleted: result.affectedRows };
}

module.exports = {
  listKeysService,
  createKeyService,
  updateKeyService,
  deleteKeyService
};

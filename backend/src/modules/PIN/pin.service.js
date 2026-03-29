async function getKeysService() {
  return await query(`SELECT * FROM key_records ORDER BY id DESC`);
}

async function createKeyService(data) {
  const result = await query(
    `INSERT INTO key_records
     (nombre, mec1, mec2, mec3, mec4, mec5, mec6, vol, back1, back2, descripcion, guardia1, guardia2)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.nombre,
      data.mec1,
      data.mec2,
      data.mec3,
      data.mec4,
      data.mec5,
      data.mec6,
      data.vol,
      data.back1,
      data.back2,
      data.descripcion,
      data.guardia1,
      data.guardia2
    ]
  );

  return result.insertId;
}

module.exports = {
  getKeysService,
  createKeyService
}

const { query } = require("./src/config/db");

const sql = `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`;
const values = [
  "Matias Chocobar",
  "matiaschocobar.dev@gmail.com",
  "$2b$10$jFTXgLyCZx0WFMM/O9k/G.FZoLp/PWWHmCUafmA6EM/p91rI7xOZm",
  "ADMIN"
];

(async () => {
  await query(sql, values);
  console.log("Usuario creado correctamente");
  process.exit(0);
})();

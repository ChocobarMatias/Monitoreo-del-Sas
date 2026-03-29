
const bcrypt = require("bcrypt");

const password = "12345678";
const email = "matiaschocobar.dev@gmail.com";
const name = "Matias Chocobar";
const role = "ADMIN";

bcrypt.hash(password, 10).then((hash) => {
  console.log(`INSERT INTO users (name, email, password_hash, role) VALUES ('${name}', '${email}', '${hash}', '${role}');`);
});

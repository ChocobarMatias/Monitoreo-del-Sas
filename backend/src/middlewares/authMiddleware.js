
const { verifyAccessToken } = require("../utils/jwt");

function authMiddleware(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("No autorizado");
      error.status = 401;
      throw error;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch {
    const error = new Error("Token inválido o expirado");
    error.status = 401;
    next(error);
  }
}

module.exports = { authMiddleware };
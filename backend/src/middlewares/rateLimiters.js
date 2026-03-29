
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    ok: false,
    message: "Demasiados intentos de inicio de sesión. Intenta nuevamente más tarde."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    ok: false,
    message: "Demasiadas solicitudes de recuperación de contraseña. Intenta nuevamente más tarde."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function errorMiddleware(error, _req, res, _next) {
  const status = error.status || 500;
  res.status(status).json({
    ok: false,
    message: error.message || "Error interno del servidor"
  });
}

module.exports = {
  loginLimiter,
  forgotPasswordLimiter,
  errorMiddleware
};
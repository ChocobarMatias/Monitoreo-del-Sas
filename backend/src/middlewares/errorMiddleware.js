
function errorMiddleware(error, _req, res, _next) {
  const status = error.status || 500;
  res.status(status).json({
    ok: false,
    message: error.message || "Error interno del servidor"
  });
}

module.exports = { errorMiddleware };
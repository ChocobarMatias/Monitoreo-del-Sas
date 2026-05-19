function errorMiddleware(error, req, res, _next) {
  const status = error.status || 500;

  console.error("[ERROR]", {
    method: req.method,
    path: req.originalUrl,
    status,
    message: error.message,
    stack: error.stack
  });

  res.status(status).json({
    ok: false,
    message: error.message || "Error interno del servidor"
  });
}

module.exports = { errorMiddleware };

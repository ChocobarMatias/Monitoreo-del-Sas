function roleMiddleware(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error("No tienes permisos");
      error.status = 403;
      return next(error);
    }
    next();
  };
}

module.exports= { roleMiddleware };
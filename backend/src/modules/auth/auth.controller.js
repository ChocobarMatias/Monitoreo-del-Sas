const { loginService, registerUserByAdminService, setPinService, validatePinService, forgotPasswordService, resetPasswordService, pinStatusService } = require("./auth.service");

async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginService({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function registerUserByAdminController(req, res, next) {
  try {
    const { name, email, password, role, grupo_sas_id, cycle_start_date, initial_week_type } = req.body;
    const result = await registerUserByAdminService({ name, email, password, role, grupo_sas_id, cycle_start_date, initial_week_type });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function setPinController(req, res, next) {
  try {
    const { pin } = req.body;
    const result = await setPinService(req.user.id, pin);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function validatePinController(req, res, next) {
  try {
    const { pin } = req.body;
    const result = await validatePinService(req.user.id, pin);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function forgotPasswordController(req, res, next) {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function resetPasswordController(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 8) {
      const error = new Error("Token y contraseña (mínimo 8 caracteres) requeridos");
      error.status = 400;
      throw error;
    }

    const result = await resetPasswordService(token, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function pinStatusController(req, res, next) {
  try {
    const result = await pinStatusService(req.user.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { loginController, registerUserByAdminController, setPinController, validatePinController, forgotPasswordController, resetPasswordController, pinStatusController };

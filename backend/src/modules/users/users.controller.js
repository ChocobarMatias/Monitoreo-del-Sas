const { listUsersService, updateUserService, listGruposService } = require("./users.service");

async function listUsersController(req, res, next) {
  try {
    const users = await listUsersService();
    res.json({ ok: true, data: users });
  } catch (err) {
    next(err);
  }
}

async function updateUserController(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role, is_active, cycle_start_date, initial_week_type, grupo_sas_id } = req.body;
    const user = await updateUserService({ id: Number(id), name, email, role, is_active, cycle_start_date, initial_week_type, grupo_sas_id });
    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function listGruposController(req, res, next) {
  try {
    const grupos = await listGruposService();
    res.json({ ok: true, data: grupos });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsersController, updateUserController, listGruposController };

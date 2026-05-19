
const { listKeysService, createKeyService, updateKeyService, deleteKeyService } = require("./keys.service");

async function listKeysController(req, res, next) {
  try {
    const data = await listKeysService();
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function createKeyController(req, res, next) {
  try {
    const data = await createKeyService(req.body);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function updateKeyController(req, res, next) {
  try {
    const data = await updateKeyService(req.params.id, req.body);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function deleteKeyController(req, res, next) {
  try {
    if (req.user?.role !== "ADMIN") {
      const err = new Error("Sin permisos");
      err.status = 403;
      return next(err);
    }
    const data = await deleteKeyService(req.params.id);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function calculateSalaryController(req, res, next) {
  res.json({ ok: true, message: "No implementado" });
}

module.exports = {
  listKeysController,
  createKeyController,
  updateKeyController,
  deleteKeyController,
  calculateSalaryController
};
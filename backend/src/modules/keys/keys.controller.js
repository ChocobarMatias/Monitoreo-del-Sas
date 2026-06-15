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
    const data = await deleteKeyService(req.params.id);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listKeysController,
  createKeyController,
  updateKeyController,
  deleteKeyController
};

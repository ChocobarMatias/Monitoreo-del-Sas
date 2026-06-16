
const { createApiKeyService } = require("./apikey.service");

async function createApiKeyController(req, res, next) {
  try {
    const { name } = req.body;
    const key = await createApiKeyService(req.user.id, name);
    res.json({ ok: true, key });
  } catch (e) {
    next(e);
  }
}

module.exports = { createApiKeyController };

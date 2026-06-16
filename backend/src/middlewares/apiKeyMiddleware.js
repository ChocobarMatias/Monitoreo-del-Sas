const { validateApiKeyService } = require("../modules/API-KEY/apikey.service");

async function apiKeyMiddleware(req, res, next) {
  try {
    const rawKey = req.headers["x-api-key"];

    if (!rawKey) {
      return res.status(401).json({ ok: false, message: "API key requerida" });
    }

    const record = await validateApiKeyService(rawKey);

    if (!record) {
      return res.status(401).json({ ok: false, message: "API key inválida" });
    }

    req.apiUserId = record.user_id;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { apiKeyMiddleware };

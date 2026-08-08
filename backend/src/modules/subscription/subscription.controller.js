const {
  getStatusService,
  getHistoryService,
  activateSubscriptionService,
  getAliasService,
} = require("./subscription.service");

async function getStatusController(req, res, next) {
  try {
    const result = await getStatusService(req.user.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getHistoryController(req, res, next) {
  try {
    const data = await getHistoryService(req.user.id);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function activateSubscriptionController(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const { activated_at, expires_at, notes } = req.body;

    if (!activated_at || !expires_at) {
      const error = new Error("activated_at y expires_at son requeridos");
      error.status = 400;
      throw error;
    }

    const result = await activateSubscriptionService(userId, req.user.id, {
      activated_at,
      expires_at,
      notes,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function getAliasController(req, res) {
  res.json({ ok: true, ...getAliasService() });
}

module.exports = {
  getStatusController,
  getHistoryController,
  activateSubscriptionController,
  getAliasController,
};

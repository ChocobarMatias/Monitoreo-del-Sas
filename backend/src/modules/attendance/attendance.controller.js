
const { applyOverrideAndRecalculateService } = require("./attendance.service");

async function applyOverrideController(req, res, next) {
  try {
    const { year, month, date, type, strikeShift } = req.body;

    const data = await applyOverrideAndRecalculateService({
      userId: req.user.id,
      year,
      month,
      date,
      type,
      strikeShift
    });

    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { applyOverrideController };
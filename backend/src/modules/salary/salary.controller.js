const { calculateSalaryService } = require("./salary.service");

async function calculateSalaryController(req, res, next) {
  try {
    const { year, month, scaleId } = req.body;

    const data = await calculateSalaryService({
      userId: req.user.id,
      year: Number(year),
      month: Number(month),
      scaleId: Number(scaleId)
    });

    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { calculateSalaryController };

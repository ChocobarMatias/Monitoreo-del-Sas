 async function calculateSalaryController(req, res, next) {
  try {
    const { year, month, scaleId } = req.body;

    const data = await calculateSalaryService({
      userId: req.user.id,
      year,
      month,
      scaleId
    });

    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  calculateSalaryController
}
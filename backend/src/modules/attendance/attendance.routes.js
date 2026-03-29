const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const {
  generateAttendanceMonthService,
  getAttendanceMonthService,
  applyOverrideAndRecalculateService
} = require("./attendance.service");
const { generateAttendancePDF } = require("./attendance.pdf");

const router = Router();

router.use(authMiddleware);

router.post("/generate", async (req, res, next) => {
  try {
    const { year, month } = req.body;
    const data = await generateAttendanceMonthService({
      userId: req.user.id,
      year: Number(year),
      month: Number(month)
    });
    res.status(201).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/:year/:month", async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const data = await getAttendanceMonthService({
      userId: req.user.id,
      year: Number(year),
      month: Number(month)
    });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/override", async (req, res, next) => {
  try {
    const { year, month, date, type, strikeShift } = req.body;
    const data = await applyOverrideAndRecalculateService({
      userId: req.user.id,
      year: Number(year),
      month: Number(month),
      date,
      type,
      strikeShift
    });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/:year/:month/pdf", async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const report = await getAttendanceMonthService({
      userId: req.user.id,
      year: Number(year),
      month: Number(month)
    });

    const pdf = generateAttendancePDF({
      rows: report.data,
      meta: {
        servicio: "S.A.S",
        mes: month,
        year,
        operador: req.user.name,
        total: report.summary.totalHours || 0
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    pdf.pipe(res);
    pdf.end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

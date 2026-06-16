const { calculateSalaryService, listConveniosService, createConvenioService } = require("./salary.service");

async function calculateSalaryController(req, res, next) {
  try {
    const { year, month, scaleId } = req.body;
    const y = Number(year);
    const m = Number(month);

    if (!Number.isInteger(y) || !Number.isInteger(m) || y < 2000 || m < 1 || m > 12) {
      return res.status(400).json({ ok: false, message: "year y month son requeridos y deben ser válidos" });
    }

    const data = await calculateSalaryService({
      userId: req.user.id,
      year: y,
      month: m,
      scaleId: scaleId ? Number(scaleId) : null,
    });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function listConveniosController(req, res, next) {
  try {
    const data = await listConveniosService();
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function createConvenioController(req, res, next) {
  try {
    const { nombre, sueldoBasico, presentismo, viaticosNoRem, aniosAntiguedad, sumaNR, vigenteDesde } = req.body;
    const data = await createConvenioService({
      nombre,
      sueldoBasico: Number(sueldoBasico),
      presentismo: Number(presentismo),
      viaticosNoRem: Number(viaticosNoRem),
      aniosAntiguedad: Number(aniosAntiguedad),
      sumaNR: Number(sumaNR),
      vigenteDesde,
    });
    res.status(201).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { calculateSalaryController, listConveniosController, createConvenioController };

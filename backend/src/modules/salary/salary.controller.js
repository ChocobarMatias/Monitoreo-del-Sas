const { calculateSalaryService, listConveniosService, createConvenioService } = require("./salary.service");

async function calculateSalaryController(req, res, next) {
  try {
    const { year, month, scaleId } = req.body;
    const data = await calculateSalaryService({
      userId: req.user.id,
      year: Number(year),
      month: Number(month),
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

const { query } = require("../../config/db");

function calcHourlyRate(base) {
  return Number(base || 0) / 200;
}

async function findScaleForPeriod(year, month) {
  const rows = await query(
    `SELECT * FROM salary_scale_versions
     WHERE year < ? OR (year = ? AND month <= ?)
     ORDER BY year DESC, month DESC
     LIMIT 1`,
    [year, year, month]
  );
  return rows[0] ?? null;
}

async function calculateSalaryService({ userId, year, month, scaleId }) {
  const monthRow = await query(
    `SELECT id, total_hours, total_night_hours, total_holiday_hours
     FROM attendance_months
     WHERE user_id = ? AND year = ? AND month = ? LIMIT 1`,
    [userId, year, month]
  );

  if (!monthRow.length) throw new Error("Mes no encontrado");

  const monthData = monthRow[0];

  let scale;
  if (scaleId) {
    const rows = await query(
      `SELECT * FROM salary_scale_versions WHERE id = ? LIMIT 1`,
      [scaleId]
    );
    scale = rows[0];
  } else {
    scale = await findScaleForPeriod(year, month);
  }

  if (!scale) throw new Error("Escala salarial no encontrada para el período");

  const s = scale;
  const valorHora = calcHourlyRate(s.sueldo_basico);
  const extraHours = Math.max(0, Number(monthData.total_hours) - 200);

  const basePay = valorHora * 200;
  const extraPay = valorHora * extraHours;
  const nightBonus = valorHora * 0.1 * Number(monthData.total_night_hours || 0);
  const holidayPay = valorHora * Number(monthData.total_holiday_hours || 0);

  const remunerative =
    basePay + extraPay + nightBonus + holidayPay +
    Number(s.adicional_presentismo || 0);

  const nonRemunerative =
    Number(s.viatico || 0) + Number(s.adicional_no_rem || 0);

  const discounts = remunerative * 0.17;
  const total = remunerative + nonRemunerative - discounts;

  await query(
    `INSERT INTO salary_calculations
     (attendance_month_id, salary_scale_version_id,
      basic_hours, extra_hours, night_hours, holiday_hours,
      gross_remunerative, gross_non_remunerative, discounts, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      monthData.id, scale.id, 200, extraHours,
      Number(monthData.total_night_hours || 0),
      Number(monthData.total_holiday_hours || 0),
      remunerative, nonRemunerative, discounts, total
    ]
  );

  return {
    scaleUsed: { id: scale.id, categoryName: scale.category_name, year: scale.year, month: scale.month },
    basePay, extraPay, nightBonus, holidayPay,
    remunerative, nonRemunerative, discounts, total
  };
}

async function listConveniosService() {
  return query(
    `SELECT * FROM convenios_salariales ORDER BY vigente_desde DESC`,
    []
  );
}

async function createConvenioService({ nombre, sueldoBasico, presentismo, viaticosNoRem, aniosAntiguedad, sumaNR, vigenteDesde }) {
  const result = await query(
    `INSERT INTO convenios_salariales
       (nombre, sueldo_basico, presentismo, viaticos_no_rem, anios_antiguedad, suma_no_remunerativa, vigente_desde)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nombre, sueldoBasico, presentismo, viaticosNoRem, aniosAntiguedad, sumaNR, vigenteDesde]
  );
  const [row] = await query(
    `SELECT * FROM convenios_salariales WHERE id = ? LIMIT 1`,
    [result.insertId]
  );
  return row;
}

module.exports = { calculateSalaryService, findScaleForPeriod, listConveniosService, createConvenioService };

const { query } = require("../../config/db");

function calcHourlyRate(base) {
  return base / 200;
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

  const scale = await query(
    `SELECT * FROM salary_scale_versions WHERE id = ? LIMIT 1`,
    [scaleId]
  );

  if (!scale.length) throw new Error("Escala no encontrada");

  const s = scale[0];

  const valorHora = calcHourlyRate(s.sueldo_basico);

  const extraHours = Math.max(0, monthData.total_hours - 200);

  const basePay = valorHora * 200;
  const extraPay = valorHora * extraHours;

  const nightBonus = valorHora * 0.1 * monthData.total_night_hours;

  const holidayPay = valorHora * monthData.total_holiday_hours;

  const remunerative =
    basePay +
    extraPay +
    nightBonus +
    holidayPay;

  return {
    remunerative,
    basePay,
    extraPay,
    nightBonus,
    holidayPay
  };
}

module.exports = { calculateSalaryService };
    extraPay +
    nightBonus +
    holidayPay +
    s.adicional_presentismo;

  const nonRemunerative =
    s.viatico +
    s.adicional_no_rem;

  const discounts = remunerative * 0.17;

  const total = remunerative + nonRemunerative - discounts;

  await query(
    `INSERT INTO salary_calculations
     (attendance_month_id, salary_scale_version_id,
      basic_hours, extra_hours, night_hours, holiday_hours,
      gross_remunerative, gross_non_remunerative, discounts, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      monthData.id,
      scaleId,
      200,
      extraHours,
      monthData.total_night_hours,
      monthData.total_holiday_hours,
      remunerative,
      nonRemunerative,
      discounts,
      total
    ]
  );

  return {
    basePay,
    extraPay,
    nightBonus,
    holidayPay,
    remunerative,
    nonRemunerative,
    discounts,
    total
  };
}
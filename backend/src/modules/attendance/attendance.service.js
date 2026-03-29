const { query } = require("../../config/db");
const { getBaseShiftForDate, applySpecialRules } = require("./attendance.engine");

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function generateAttendanceMonthService() {
  // Implementar lógica real aquí si es necesario
  return {};
}


async function getAttendanceMonthService({ userId, year, month }) {
  // Generar planilla tipo la de la imagen
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  let totalHoras = 0;
  const rows = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    const dayName = dayNames[date.getDay()];
    // Patrón: días impares trabajan 8-20 (12h), pares descansan
    let hrIngreso = 0, hrEgreso = 0, total = 0;
    if (i % 2 !== 0) {
      hrIngreso = 8;
      hrEgreso = 20;
      total = 12;
      totalHoras += 12;
    }
    rows.push({
      numero: i,
      dia: dayName,
      hrIngreso,
      hrEgreso,
      totalHrNormal: total
    });
  }
  return {
    data: rows,
    summary: { totalHoras }
  };
}

async function applyOverrideAndRecalculateService({
  userId,
  year,
  month,
  date,
  type,
  strikeShift
}) {
  const monthRow = await query(
    `SELECT id FROM attendance_months
     WHERE user_id = ? AND year = ? AND month = ? LIMIT 1`,
    [userId, year, month]
  );

  if (!monthRow.length) {
    throw new Error("Mes no generado");
  }

  const monthId = monthRow[0].id;
  // 1. Guardar override
  await query(
    `INSERT INTO attendance_overrides
     (attendance_month_id, work_date, type, strike_shift)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       type = VALUES(type),
       strike_shift = VALUES(strike_shift)`,
    [monthId, date, type, strikeShift || null]
  );

  // 2. Traer overrides
  const overrides = await query(
    `SELECT * FROM attendance_overrides
     WHERE attendance_month_id = ?`,
    [monthId]
  );

  const overrideMap = new Map();
  overrides.forEach(o => {
    const dateKey = typeof o.work_date === "string"
  ? o.work_date
  : o.work_date.toISOString().split("T")[0];

overrideMap.set(dateKey, o);
  });

  // 3. Traer todos los días del mes
  const days = await query(
    `SELECT * FROM attendance_days
     WHERE attendance_month_id = ?
     ORDER BY work_date ASC`,
    [monthId]
  );

  let previousDayWorked = false;

  let totalHours = 0;
  let totalNightHours = 0;
  let totalHolidayHours = 0;

  for (const day of days) {
    const dateStr = typeof day.work_date === "string"
  ? day.work_date
  : formatDate(new Date(day.work_date));
    const baseShift = getBaseShiftForDate(dateStr);

    const override = overrideMap.get(dateStr);

    const finalShift = applySpecialRules({
      date: dateStr,
      baseShift,
      previousDayWorked,

      isHoliday: override?.type === "HOLIDAY",
      isStrike: override?.type === "STRIKE",
      strikeShiftType: override?.strike_shift,
      isRest: override?.type === "REST",
      isVacation: override?.type === "VACATION",
      isSickLeave: override?.type === "SICK"
    });

    await query(
      `UPDATE attendance_days
       SET shift_type = ?, start_time = ?, end_time = ?,
           worked_hours = ?, night_hours = ?, holiday_paid_hours = ?,
           is_holiday = ?, is_strike = ?, is_rest = ?, is_vacation = ?, is_sick_leave = ?,
           source = 'MANUAL'
       WHERE id = ?`,
      [
        finalShift.shiftType,
        finalShift.startTime,
        finalShift.endTime,
        finalShift.workedHours,
        finalShift.nightHours,
        finalShift.holidayPaidHours,

        override?.type === "HOLIDAY" ? 1 : 0,
        override?.type === "STRIKE" ? 1 : 0,
        override?.type === "REST" ? 1 : 0,
        override?.type === "VACATION" ? 1 : 0,
        override?.type === "SICK" ? 1 : 0,

        day.id
      ]
    );

    previousDayWorked = finalShift.workedHours > 0;

    totalHours += Number(finalShift.workedHours);
    totalNightHours += Number(finalShift.nightHours);
    totalHolidayHours += Number(finalShift.holidayPaidHours);
  }

  const suggestedRestDays =
    totalHours > 204 ? Math.ceil((totalHours - 204) / 12) : 0;

  await query(
    `UPDATE attendance_months
     SET total_hours = ?, total_night_hours = ?, total_holiday_hours = ?, suggested_rest_days = ?
     WHERE id = ?`,
    [totalHours, totalNightHours, totalHolidayHours, suggestedRestDays, monthId]
  );

  return {
    totalHours,
    totalNightHours,
    totalHolidayHours,
    suggestedRestDays
  };
}

module.exports = {
  generateAttendanceMonthService,
  getAttendanceMonthService,
  applyOverrideAndRecalculateService
};
const { query } = require("../../config/db");
const { getWeekType, getBaseShiftByCycle, applyRules } = require("./attendance.engine");

function normalizeDate(dateValue) {
  const date = new Date(dateValue);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dayNameFromDate(date) {
  return ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"][date.getDay()];
}

function weekCycleFromDay(dayNumber) {
  return ["A", "B", "C", "D"][(dayNumber - 1) % 4];
}

function prevMonthOf(year, month) {
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
}

function nextMonthOf(year, month) {
  return month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 };
}

function monthRank(year, month) {
  return year * 12 + month;
}

function getEmptySummary() {
  return {
    totalHours: 0,
    totalNightHours: 0,
    totalHolidayHours: 0,
    workedDays: 0,
    restDays: 0,
    totalHolidays: 0,
    weekendDays: 0,
  };
}


/**
 * Genera el array de días del mes con turnos automáticos según ciclo A/B y reglas de negocio.
 * @param {Object} params
 * @param {number} year
 * @param {number} month
 * @param {Map} overrideMap
 * @param {Object} initialState
 * @param {Date} cycleStartDate
 * @param {"A"|"B"} initialWeekType
 * @returns {{rows: Array, summary: Object}}
 */
function buildMonthRows({ year, month, overrideMap, initialState, cycleStartDate, initialWeekType }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const rows = [];
  const summary = getEmptySummary();
  let prevWorked = initialState?.previousWorked || false;
  let prevShiftType = initialState?.lastWorkedShiftType || null;

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const date = new Date(year, month - 1, dayNumber);
    const dateKey = normalizeDate(date);
    const override = overrideMap.get(dateKey);
    const isHoliday = override?.type === "HOLIDAY";
    const isStrike = override?.type === "STRIKE";
    const isRest = override?.type === "REST";
    const isVacation = override?.type === "VACATION";
    const isSickLeave = override?.type === "SICK";
    // holiday_worked: null/1 → trabajó, 0 → feriado libre
    const holidayWorked = isHoliday ? (override?.holiday_worked !== 0) : null;

    const weekType = getWeekType(date, cycleStartDate, initialWeekType);
    const baseShiftType = getBaseShiftByCycle(weekType, date.getDay());
    const shift = applyRules({
      baseShift: baseShiftType,
      isHoliday,
      holidayWorked,
      isStrike,
      isRest,
      isVacation,
      isSickLeave,
      prevWorked,
      prevShiftType
    });

    const row = {
      workDate: dateKey,
      weekCycle: weekType,
      dayName: dayNameFromDate(date),
      shiftType: shift.shiftType,
      startTime: shift.startTime,
      endTime: shift.endTime,
      workedHours: Number(shift.workedHours || 0),
      nightHours: Number(shift.nightHours || 0),
      holidayPaidHours: Number(shift.holidayPaidHours || 0),
      isHoliday: isHoliday ? 1 : 0,
      isStrike: isStrike ? 1 : 0,
      isRest: isRest ? 1 : 0,
      isVacation: isVacation ? 1 : 0,
      isSickLeave: isSickLeave ? 1 : 0,
      source: override ? "MANUAL" : "AUTO"
    };

    summary.totalHours += row.workedHours;
    summary.totalNightHours += row.nightHours;
    summary.totalHolidayHours += row.holidayPaidHours;
    if (isHoliday) summary.totalHolidays++;
    if (isRest) summary.restDays++;
    rows.push(row);

    if (row.workedHours > 0) {
      summary.workedDays++;
      const dow = date.getDay();
      if (row.shiftType === "DAY" && (dow === 0 || dow === 6)) summary.weekendDays++;
      prevShiftType = row.shiftType;
      prevWorked = true;
    } else {
      prevShiftType = null;
      prevWorked = false;
    }
  }

  return { rows, summary };
}

  // const daysInMonth = new Date(year, month, 0).getDate();
  // const rows = [];
  // const summary = getEmptySummary();

  // for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
  //   const jsDate = new Date(year, month - 1, dayNumber);
  //   const dateKey = normalizeDate(jsDate);

  //   const override = overrideMap.get(dateKey);

  //   const baseShift = getBaseShiftForDate({
  //     date: jsDate,
  //     initialState
  //   });

  //   const finalShift = applySpecialRules({
  //     baseShift,
  //     override,
  //     date: jsDate
  //   });

  //   const row = {
  //     workDate: dateKey,
  //     weekCycle: weekCycleFromDay(dayNumber),
  //     dayName: dayNameFromDate(jsDate),

  //     shiftType: finalShift.shiftType,
  //     startTime: finalShift.startTime,
  //     endTime: finalShift.endTime,
  //     workedHours: Number(finalShift.workedHours || 0),
  //     nightHours: Number(finalShift.nightHours || 0),
  //     holidayPaidHours: Number(finalShift.holidayPaidHours || 0),

  //     isHoliday: override?.type === "HOLIDAY" ? 1 : 0,
  //     isStrike: override?.type === "STRIKE" ? 1 : 0,
  //     isRest: override?.type === "REST" ? 1 : 0,
  //     isVacation: override?.type === "VACATION" ? 1 : 0,
  //     isSickLeave: override?.type === "SICK" ? 1 : 0,

  //     source: override ? "MANUAL" : "AUTO"
  //   };

  //   summary.totalHours += row.workedHours;
  //   summary.totalNightHours += row.nightHours;
  //   summary.totalHolidayHours += row.holidayPaidHours;

  //   rows.push(row);
  // }

  // summary.suggestedRestDays =
  //   summary.totalHours > 204 ? Math.ceil((summary.totalHours - 204) / 12) : 0;

  // return { rows, summary };










async function getOrCreateAttendanceMonth({ userId, year, month }) {
  await query(
    `INSERT INTO attendance_months (user_id, year, month)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    [userId, year, month]
  );

  const monthRows = await query(
    `SELECT * FROM attendance_months
     WHERE user_id = ? AND year = ? AND month = ?
     LIMIT 1`,
    [userId, year, month]
  );

  return monthRows[0] || null;
}

async function getMonthOverrides(attendanceMonthId) {
  const overrides = await query(
    `SELECT * FROM attendance_overrides
     WHERE attendance_month_id = ?`,
    [attendanceMonthId]
  );

  const overrideMap = new Map();
  overrides.forEach((row) => {
    const dateKey = normalizeDate(row.work_date);
    overrideMap.set(dateKey, row);
  });

  return overrideMap;
}

async function getInitialStateFromPreviousMonth({ userId, year, month }) {
  const prev = prevMonthOf(year, month);

  const prevMonthRows = await query(
    `SELECT id FROM attendance_months
     WHERE user_id = ? AND year = ? AND month = ?
     LIMIT 1`,
    [userId, prev.year, prev.month]
  );

  if (!prevMonthRows.length) {
    return { previousWorked: false, lastWorkedShiftType: null };
  }

  const prevMonthId = prevMonthRows[0].id;

  const [lastDayRow] = await query(
    `SELECT shift_type, worked_hours
     FROM attendance_days
     WHERE attendance_month_id = ?
     ORDER BY work_date DESC
     LIMIT 1`,
    [prevMonthId]
  );

  if (!lastDayRow) {
    return { previousWorked: false, lastWorkedShiftType: null };
  }

  const [lastWorkedRow] = await query(
    `SELECT shift_type
     FROM attendance_days
     WHERE attendance_month_id = ?
       AND shift_type IN ('DAY', 'NIGHT')
       AND worked_hours > 0
     ORDER BY work_date DESC
     LIMIT 1`,
    [prevMonthId]
  );

  return {
    previousWorked: Number(lastDayRow.worked_hours || 0) > 0,
    lastWorkedShiftType: lastWorkedRow?.shift_type || null
  };
}

async function persistMonthDays(attendanceMonthId, rows) {
  for (const row of rows) {
    const workDate = normalizeDate(row.workDate);

    await query(
      `INSERT INTO attendance_days
      (attendance_month_id, work_date, week_cycle, day_name, shift_type, start_time, end_time,
       worked_hours, night_hours, holiday_paid_hours,
       is_holiday, is_strike, is_rest, is_vacation, is_sick_leave, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        week_cycle = VALUES(week_cycle),
        day_name = VALUES(day_name),
        shift_type = VALUES(shift_type),
        start_time = VALUES(start_time),
        end_time = VALUES(end_time),
        worked_hours = VALUES(worked_hours),
        night_hours = VALUES(night_hours),
        holiday_paid_hours = VALUES(holiday_paid_hours),
        is_holiday = VALUES(is_holiday),
        is_strike = VALUES(is_strike),
        is_rest = VALUES(is_rest),
        is_vacation = VALUES(is_vacation),
        is_sick_leave = VALUES(is_sick_leave),
        source = VALUES(source)`,
      [
        attendanceMonthId,
        workDate,
        row.weekCycle,
        row.dayName,
        row.shiftType,
        row.startTime,
        row.endTime,
        row.workedHours,
        row.nightHours,
        row.holidayPaidHours,
        row.isHoliday,
        row.isStrike,
        row.isRest,
        row.isVacation,
        row.isSickLeave,
        row.source
      ]
    );
  }
}

async function updateMonthSummary(attendanceMonthId, summary) {
  await query(
    `UPDATE attendance_months
     SET total_hours = ?, total_night_hours = ?, total_holiday_hours = ?,
         suggested_rest_days = ?, worked_days = ?, total_holidays = ?, weekend_days = ?
     WHERE id = ?`,
    [
      summary.totalHours,
      summary.totalNightHours,
      summary.totalHolidayHours,
      summary.restDays,
      summary.workedDays,
      summary.totalHolidays,
      summary.weekendDays,
      attendanceMonthId
    ]
  );
}

async function getUserCycleConfig(userId) {
  const rows = await query(
    `SELECT u.cycle_start_date, u.initial_week_type, u.grupo_sas_id,
            g.tipo_inicio AS grupo_tipo_inicio, g.cycle_start_date AS grupo_cycle_start
     FROM users u
     LEFT JOIN grupos_sas g ON g.id = u.grupo_sas_id
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  const row = rows[0];

  if (row?.grupo_sas_id) {
    return {
      cycleStartDate: new Date(row.grupo_cycle_start),
      initialWeekType: row.grupo_tipo_inicio
    };
  }

  return {
    cycleStartDate: row?.cycle_start_date
      ? new Date(row.cycle_start_date)
      : new Date(2026, 5, 1),
    initialWeekType: row?.initial_week_type || "A"
  };
}

async function recalculateMonth({ userId, year, month }) {
  const monthRow = await getOrCreateAttendanceMonth({ userId, year, month });
  const overrideMap = await getMonthOverrides(monthRow.id);
  const initialState = await getInitialStateFromPreviousMonth({ userId, year, month });
  const { cycleStartDate, initialWeekType } = await getUserCycleConfig(userId);

  const { rows, summary } = buildMonthRows({ year, month, overrideMap, initialState, cycleStartDate, initialWeekType });

  await persistMonthDays(monthRow.id, rows);
  await updateMonthSummary(monthRow.id, summary);

  return { monthId: monthRow.id, summary };
}

async function recalculateFutureMonths({ userId, year, month }) {
  const currentRank = monthRank(year, month);

  const futureMonths = await query(
    `SELECT year, month
     FROM attendance_months
     WHERE user_id = ?
     ORDER BY year ASC, month ASC`,
    [userId]
  );

  for (const item of futureMonths) {
    const y = Number(item.year);
    const m = Number(item.month);

    if (monthRank(y, m) > currentRank) {
      await recalculateMonth({ userId, year: y, month: m });
    }
  }
}

async function generateSequentialMonthsUntil({ userId, year, month }) {
  const existing = await query(
    `SELECT year, month
     FROM attendance_months
     WHERE user_id = ?
     ORDER BY year ASC, month ASC`,
    [userId]
  );

  const targetRank = monthRank(year, month);

  const existingSorted = existing
    .map((item) => ({ year: Number(item.year), month: Number(item.month) }))
    .sort((a, b) => monthRank(a.year, a.month) - monthRank(b.year, b.month));

  let start = { year, month };

  for (const item of existingSorted) {
    if (monthRank(item.year, item.month) < targetRank) {
      start = nextMonthOf(item.year, item.month);
    }
  }

  let cursor = { ...start };

  while (monthRank(cursor.year, cursor.month) <= targetRank) {
    await recalculateMonth({ userId, year: cursor.year, month: cursor.month });
    cursor = nextMonthOf(cursor.year, cursor.month);
  }
}

async function generateAttendanceMonthService({ userId, year, month }) {
  await generateSequentialMonthsUntil({ userId, year, month });
  return getAttendanceMonthService({ userId, year, month });
}

async function getAttendanceMonthService({ userId, year, month }) {
  const monthRows = await query(
    `SELECT * FROM attendance_months
     WHERE user_id = ? AND year = ? AND month = ? LIMIT 1`,
    [userId, year, month]
  );

  if (!monthRows.length) {
    await generateSequentialMonthsUntil({ userId, year, month });
    return getAttendanceMonthService({ userId, year, month });
  }

  const monthRow = monthRows[0];

  const days = await query(
    `SELECT * FROM attendance_days
     WHERE attendance_month_id = ?
     ORDER BY work_date ASC`,
    [monthRow.id]
  );

  const data = days.map((day) => ({
    ...day,
    work_date: normalizeDate(day.work_date)
  }));

  return {
    data,
    summary: {
      totalHours: Number(monthRow.total_hours || 0),
      totalNightHours: Number(monthRow.total_night_hours || 0),
      totalHolidayHours: Number(monthRow.total_holiday_hours || 0),
      suggestedRestDays: Number(monthRow.suggested_rest_days || 0),
      workedDays: Number(monthRow.worked_days || 0),
      totalHolidays: Number(monthRow.total_holidays || 0),
      weekendDays: Number(monthRow.weekend_days || 0),
    }
  };
}

async function applyOverrideAndRecalculateService({ userId, year, month, date, type, strikeShift, holidayWorked }) {
  const monthRow = await getOrCreateAttendanceMonth({ userId, year, month });
  const normalizedDate = normalizeDate(date);

  const hwValue = holidayWorked === true ? 1 : holidayWorked === false ? 0 : null;

  await query(
    `INSERT INTO attendance_overrides
     (attendance_month_id, work_date, type, strike_shift, holiday_worked)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      type = VALUES(type),
      strike_shift = VALUES(strike_shift),
      holiday_worked = VALUES(holiday_worked)`,
    [monthRow.id, normalizedDate, type, strikeShift || null, hwValue]
  );

  const { summary } = await recalculateMonth({ userId, year, month });
  await recalculateFutureMonths({ userId, year, month });

  return summary;
}

async function manualUpdateDayService({ userId, year, month, date, startTime, endTime, workedHours }) {
  const monthRow = await getOrCreateAttendanceMonth({ userId, year, month });

  const shiftType = startTime === "20:00" ? "NIGHT" : "DAY";
  const nightHours = shiftType === "NIGHT" ? 9 : 0;
  const hours = Number(workedHours) || 0;

  await query(
    `UPDATE attendance_days
     SET shift_type = ?, start_time = ?, end_time = ?,
         worked_hours = ?, night_hours = ?, source = 'MANUAL'
     WHERE attendance_month_id = ? AND work_date = ?`,
    [shiftType, startTime, endTime, hours, hours > 0 ? nightHours : 0, monthRow.id, date]
  );

  const [result] = await query(
    `SELECT
       SUM(worked_hours) AS totalHours,
       SUM(night_hours) AS totalNightHours,
       SUM(holiday_paid_hours) AS totalHolidayHours,
       SUM(worked_hours > 0) AS workedDays,
       SUM(is_holiday) AS totalHolidays,
       SUM(is_rest) AS restDays,
       SUM(shift_type = 'DAY' AND DAYOFWEEK(work_date) IN (1, 7)) AS weekendDays
     FROM attendance_days WHERE attendance_month_id = ?`,
    [monthRow.id]
  );

  const summary = {
    totalHours: Number(result.totalHours || 0),
    totalNightHours: Number(result.totalNightHours || 0),
    totalHolidayHours: Number(result.totalHolidayHours || 0),
    workedDays: Number(result.workedDays || 0),
    restDays: Number(result.restDays || 0),
    totalHolidays: Number(result.totalHolidays || 0),
    weekendDays: Number(result.weekendDays || 0),
  };

  await updateMonthSummary(monthRow.id, summary);
  return summary;
}

module.exports = {
  generateAttendanceMonthService,
  getAttendanceMonthService,
  applyOverrideAndRecalculateService,
  manualUpdateDayService
};
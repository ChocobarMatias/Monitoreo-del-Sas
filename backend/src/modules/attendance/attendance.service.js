const { query } = require("../../config/db");
const { getBaseShiftForDate, applySpecialRules } = require("./attendance.engine");

function normalizeDate(dateValue) {
  return String(dateValue).split("T")[0];
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
    suggestedRestDays: 0
  };
}

function toOverrideFlags(override) {
  return {
    isHoliday: override?.type === "HOLIDAY",
    isStrike: override?.type === "STRIKE",
    strikeShiftType: override?.strike_shift || null,
    isRest: override?.type === "REST",
    isVacation: override?.type === "VACATION",
    isSickLeave: override?.type === "SICK"
  };
}

function buildMonthRows({ year, month, overrideMap, initialState }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const rows = [];
  const summary = getEmptySummary();

  let previousWorked = Boolean(initialState?.previousWorked);
  let lastWorkedShiftType = initialState?.lastWorkedShiftType || null;

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const jsDate = new Date(year, month - 1, dayNumber);
    const dateKey = normalizeDate(jsDate);

    const baseShift = getBaseShiftForDate({ previousWorked, lastWorkedShiftType });
    const override = overrideMap.get(dateKey);

    const finalShift = applySpecialRules({
      baseShift,
      previousWorked,
      lastWorkedShiftType,
      ...toOverrideFlags(override)
    });

    const workedToday = Number(finalShift.workedHours) > 0;
    if (workedToday && (finalShift.shiftType === "DAY" || finalShift.shiftType === "NIGHT")) {
      lastWorkedShiftType = finalShift.shiftType;
    }

    previousWorked = workedToday;

    summary.totalHours += Number(finalShift.workedHours || 0);
    summary.totalNightHours += Number(finalShift.nightHours || 0);
    summary.totalHolidayHours += Number(finalShift.holidayPaidHours || 0);

    rows.push({
      workDate: dateKey,
      weekCycle: weekCycleFromDay(dayNumber),
      dayName: dayNameFromDate(jsDate),
      shiftType: finalShift.shiftType,
      startTime: finalShift.startTime,
      endTime: finalShift.endTime,
      workedHours: Number(finalShift.workedHours || 0),
      nightHours: Number(finalShift.nightHours || 0),
      holidayPaidHours: Number(finalShift.holidayPaidHours || 0),
      isHoliday: override?.type === "HOLIDAY" ? 1 : 0,
      isStrike: override?.type === "STRIKE" ? 1 : 0,
      isRest: override?.type === "REST" ? 1 : 0,
      isVacation: override?.type === "VACATION" ? 1 : 0,
      isSickLeave: override?.type === "SICK" ? 1 : 0,
      source: override ? "MANUAL" : "AUTO"
    });
  }

  summary.suggestedRestDays =
    summary.totalHours > 204 ? Math.ceil((summary.totalHours - 204) / 12) : 0;

  return { rows, summary };
}

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
        row.workDate,
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
     SET total_hours = ?, total_night_hours = ?, total_holiday_hours = ?, suggested_rest_days = ?
     WHERE id = ?`,
    [
      summary.totalHours,
      summary.totalNightHours,
      summary.totalHolidayHours,
      summary.suggestedRestDays,
      attendanceMonthId
    ]
  );
}

async function recalculateMonth({ userId, year, month }) {
  const monthRow = await getOrCreateAttendanceMonth({ userId, year, month });
  const overrideMap = await getMonthOverrides(monthRow.id);
  const initialState = await getInitialStateFromPreviousMonth({ userId, year, month });

  const { rows, summary } = buildMonthRows({ year, month, overrideMap, initialState });
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
      suggestedRestDays: Number(monthRow.suggested_rest_days || 0)
    }
  };
}

async function applyOverrideAndRecalculateService({ userId, year, month, date, type, strikeShift }) {
  const monthRow = await getOrCreateAttendanceMonth({ userId, year, month });
  const normalizedDate = normalizeDate(date);

  await query(
    `INSERT INTO attendance_overrides
     (attendance_month_id, work_date, type, strike_shift)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      type = VALUES(type),
      strike_shift = VALUES(strike_shift)`,
    [monthRow.id, normalizedDate, type, strikeShift || null]
  );

  const { summary } = await recalculateMonth({ userId, year, month });
  await recalculateFutureMonths({ userId, year, month });

  return summary;
}

module.exports = {
  generateAttendanceMonthService,
  getAttendanceMonthService,
  applyOverrideAndRecalculateService
};

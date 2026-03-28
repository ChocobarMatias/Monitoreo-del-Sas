import { attendanceRepository } from '../repositories/attendanceRepository.js';
import { prisma } from '../config/prisma.js';
import { eachDateInRange, monthDateRange, toIsoDate } from '../utils/date.js';

const NIGHT_SHIFT = { shiftStart: '20:00', shiftEnd: '08:00', hours: 12, isNight: true };
const DAY_SHIFT = { shiftStart: '08:00', shiftEnd: '20:00', hours: 12, isNight: false };

const weekPatterns = {
  A: [1, 3, 5, 6, 0],
  B: [2, 4, 6, 0],
  C: [1, 3, 5, 6, 0],
  D: [2, 4, 6, 0]
};

const weekCodeForDate = (date, cycleStart = new Date('2025-01-06T00:00:00Z')) => {
  const diffDays = Math.floor((date - cycleStart) / (1000 * 60 * 60 * 24));
  const weekOffset = Math.floor(diffDays / 7);
  return ['A', 'B', 'C', 'D'][(weekOffset % 4 + 4) % 4];
};

const shiftForScheduledDay = (weekCode, weekday) => {
  if (!weekPatterns[weekCode].includes(weekday)) return null;

  if ((weekCode === 'B' || weekCode === 'D') && [6, 0].includes(weekday)) {
    return { ...DAY_SHIFT };
  }

  return { ...NIGHT_SHIFT };
};

export const attendanceEngine = {
  async generateMonthlyAttendance(userId, year, month) {
    const { start, end } = monthDateRange(year, month);
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        startDate: { lte: end },
        endDate: { gte: start }
      }
    });

    const holidaySet = new Set(events.filter((e) => e.eventType === 'HOLIDAY').flatMap((e) => eachDateInRange(e.startDate, e.endDate).map(toIsoDate)));
    const restSet = new Set(events.filter((e) => e.eventType === 'REST_DAY').flatMap((e) => eachDateInRange(e.startDate, e.endDate).map(toIsoDate)));
    const leaveMap = new Map();

    events
      .filter((e) => ['VACATION', 'SICK_LEAVE'].includes(e.eventType))
      .forEach((e) => eachDateInRange(e.startDate, e.endDate).forEach((d) => leaveMap.set(toIsoDate(d), e.eventType)));

    const strikeByDate = new Map(
      events
        .filter((e) => e.eventType === 'STRIKE')
        .flatMap((e) => eachDateInRange(e.startDate, e.endDate).map((d) => [toIsoDate(d), e.metadata]))
    );

    const generated = [];

    for (const date of eachDateInRange(start, end)) {
      const iso = toIsoDate(date);
      const weekday = date.getUTCDay();
      const weekCode = weekCodeForDate(date);
      const previousIso = toIsoDate(new Date(date.getTime() - 24 * 60 * 60 * 1000));
      const previousWorked = generated.find((g) => g.workDate === previousIso && g.hours > 0);
      let shift = shiftForScheduledDay(weekCode, weekday);
      let isHoliday = false;
      let notes = [];

      if (strikeByDate.has(iso)) {
        const strikeShift = strikeByDate.get(iso);
        shift = strikeShift?.shiftStart ? strikeShift : null;
        notes.push('General strike manual shift selected');
      }

      if (holidaySet.has(iso)) {
        isHoliday = true;
        if (shift) {
          if (!previousWorked) {
            shift = { ...DAY_SHIFT };
          }
          shift.hours *= 2;
        } else {
          shift = { ...NIGHT_SHIFT, hours: NIGHT_SHIFT.hours * 2 };
        }
        notes.push('Holiday with doubled hours');
      }

      if (leaveMap.has(iso)) {
        shift = { shiftStart: '00:00', shiftEnd: '23:59', hours: 8, isNight: false };
        notes.push(`${leaveMap.get(iso)} override`);
      }

      if (restSet.has(iso)) {
        shift = { shiftStart: '00:00', shiftEnd: '00:00', hours: 0, isNight: false };
        notes.push('Rest day override');
      }

      const record = {
        workDate: date,
        shiftStart: shift?.shiftStart ?? '00:00',
        shiftEnd: shift?.shiftEnd ?? '00:00',
        hours: shift?.hours ?? 0,
        isNight: shift?.isNight ?? false,
        isHoliday,
        notes: notes.join(' | ') || null
      };

      await attendanceRepository.upsert(userId, record);
      generated.push({ ...record, workDate: iso });
    }

    return generated;
  }
};

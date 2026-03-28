import { Decimal } from '@prisma/client/runtime/library';
import { attendanceRepository } from '../repositories/attendanceRepository.js';
import { salaryRepository } from '../repositories/salaryRepository.js';
import { monthDateRange } from '../utils/date.js';

const toNumber = (value) => (value instanceof Decimal ? Number(value.toString()) : Number(value));

export const salaryEngine = {
  async calculateMonthlySalary(userId, year, month, deductions = 0) {
    const scale = await salaryRepository.latestScale();
    if (!scale) throw new Error('No salary scale configured');

    const { start, end } = monthDateRange(year, month);
    const records = await attendanceRepository.findMonthlyByUser(userId, start, end);

    const baseHourlyRate = toNumber(scale.baseHourlyRate);
    const nightMultiplier = toNumber(scale.nightMultiplier);
    const holidayMultiplier = toNumber(scale.holidayMultiplier);

    const base = records.reduce((acc, r) => acc + Number(r.hours) * baseHourlyRate, 0);
    const nightHours = records.filter((r) => r.isNight).reduce((acc, r) => acc + Number(r.hours), 0);
    const holidayHours = records.filter((r) => r.isHoliday).reduce((acc, r) => acc + Number(r.hours), 0);

    const nightPay = nightHours * baseHourlyRate * (nightMultiplier - 1);
    const holidayPay = holidayHours * baseHourlyRate * (holidayMultiplier - 1);
    const total = base + nightPay + holidayPay - deductions;

    return {
      scaleVersion: scale.versionLabel,
      base,
      nightHours,
      nightPay,
      holidayHours,
      holidayPay,
      deductions,
      total
    };
  }
};

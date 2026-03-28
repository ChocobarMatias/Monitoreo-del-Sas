import { attendanceGenerationSchema, salaryCalcSchema } from '../validators/schemas.js';
import { attendanceEngine } from '../services/attendanceEngine.js';
import { salaryEngine } from '../services/salaryEngine.js';
import { attendanceRepository } from '../repositories/attendanceRepository.js';
import { monthDateRange } from '../utils/date.js';
import { pdfService } from '../services/pdfService.js';
import { prisma } from '../config/prisma.js';
import { integrationService } from '../services/integrationService.js';

export const attendanceController = {
  async generate(req, res) {
    const payload = attendanceGenerationSchema.parse(req.body);
    const records = await attendanceEngine.generateMonthlyAttendance(payload.userId, payload.year, payload.month);

    req.realtime?.emitAttendanceUpdated(payload.userId, { year: payload.year, month: payload.month, count: records.length });

    await integrationService.notifyTelegram(`Attendance generated for user ${payload.userId} (${payload.year}-${payload.month}).`);
    await integrationService.dispatchWebhooks('attendance.generated', { ...payload, recordsCount: records.length }, payload.userId);

    res.json({ records });
  },

  async calculateSalary(req, res) {
    const payload = salaryCalcSchema.parse(req.body);
    const result = await salaryEngine.calculateMonthlySalary(payload.userId, payload.year, payload.month, payload.deductions);

    await integrationService.dispatchWebhooks('salary.calculated', { ...payload, total: result.total }, payload.userId);

    res.json(result);
  },

  async exportPdf(req, res) {
    const userId = Number(req.params.userId);
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const { start, end } = monthDateRange(year, month);
    const records = await attendanceRepository.findMonthlyByUser(userId, start, end);
    const doc = pdfService.buildAttendancePdf(records, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${year}-${month}.pdf`);
    doc.pipe(res);
  }
};

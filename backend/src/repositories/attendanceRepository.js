import { prisma } from '../config/prisma.js';

export const attendanceRepository = {
  upsert: (userId, dayRecord) =>
    prisma.attendanceRecord.upsert({
      where: { userId_workDate: { userId, workDate: dayRecord.workDate } },
      create: { userId, ...dayRecord },
      update: dayRecord
    }),
  findMonthlyByUser: (userId, start, end) =>
    prisma.attendanceRecord.findMany({
      where: { userId, workDate: { gte: start, lte: end } },
      orderBy: { workDate: 'asc' }
    })
};

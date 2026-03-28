import { prisma } from '../config/prisma.js';

export const eventRepository = {
  create: (data) => prisma.calendarEvent.create({ data }),
  findByUserAndRange: (userId, startDate, endDate) =>
    prisma.calendarEvent.findMany({
      where: {
        userId,
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      },
      orderBy: { startDate: 'asc' }
    })
};

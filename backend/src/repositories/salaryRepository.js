import { prisma } from '../config/prisma.js';

export const salaryRepository = {
  latestScale: () => prisma.salaryScaleVersion.findFirst({ orderBy: { createdAt: 'desc' } }),
  createScale: (data) => prisma.salaryScaleVersion.create({ data })
};

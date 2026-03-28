import { prisma } from '../config/prisma.js';

export const securityRepository = {
  createApiKey: (data) => prisma.apiKey.create({ data }),
  createWebhook: (data) => prisma.webhook.create({ data }),
  listWebhooks: () => prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } })
};

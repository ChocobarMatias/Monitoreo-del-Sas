import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { eventRepository } from '../repositories/eventRepository.js';
import { securityRepository } from '../repositories/securityRepository.js';
import { salaryRepository } from '../repositories/salaryRepository.js';
import { securityService } from './securityService.js';

export const adminService = {
  async createEvent(payload) {
    return eventRepository.create({
      ...payload,
      startDate: new Date(`${payload.startDate}T00:00:00Z`),
      endDate: new Date(`${payload.endDate}T00:00:00Z`)
    });
  },

  async createSalaryScale(payload) {
    return salaryRepository.createScale(payload);
  },

  async createApiKey(name) {
    const rawKey = `swm_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = securityService.hashApiKey(rawKey);
    await securityRepository.createApiKey({ name, keyHash });
    return { key: rawKey, name };
  },

  async createWebhook(payload) {
    return securityRepository.createWebhook(payload);
  },

  async listWebhooks() {
    return securityRepository.listWebhooks();
  },

  async listUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true }
    });
  }
};

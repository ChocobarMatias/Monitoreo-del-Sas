import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export const securityService = {
  hashApiKey(rawKey) {
    return crypto.createHmac('sha256', env.apiKeySalt).update(rawKey).digest('hex');
  },

  async validateApiKey(rawKey) {
    const hash = this.hashApiKey(rawKey);
    const key = await prisma.apiKey.findFirst({ where: { keyHash: hash, isActive: true } });
    if (!key) return false;
    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    return true;
  },

  async setPin(userId, pin) {
    const pinHash = await bcrypt.hash(pin, 10);
    return prisma.user.update({ where: { id: userId }, data: { pinHash } });
  },

  async validatePin(userId, pin) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.pinHash) return false;
    return bcrypt.compare(pin, user.pinHash);
  }
};

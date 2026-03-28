import { z } from 'zod';
import { securityService } from '../services/securityService.js';

const pinSchema = z.object({ pin: z.string().regex(/^\d{4,8}$/) });

export const securityController = {
  async setPin(req, res) {
    const { pin } = pinSchema.parse(req.body);
    await securityService.setPin(req.user.sub, pin);
    res.json({ message: 'PIN updated' });
  },

  async validatePin(req, res) {
    const { pin } = pinSchema.parse(req.body);
    const valid = await securityService.validatePin(req.user.sub, pin);
    res.json({ valid });
  }
};

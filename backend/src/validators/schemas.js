import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'USER']).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const recoverySchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8)
});

export const attendanceGenerationSchema = z.object({
  userId: z.coerce.number().int(),
  year: z.coerce.number().int().min(2020),
  month: z.coerce.number().int().min(1).max(12)
});

export const salaryCalcSchema = z.object({
  userId: z.coerce.number().int(),
  year: z.coerce.number().int().min(2020),
  month: z.coerce.number().int().min(1).max(12),
  deductions: z.coerce.number().min(0).default(0)
});

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const eventCreateSchema = z.object({
  userId: z.coerce.number().int(),
  eventType: z.enum(['HOLIDAY', 'STRIKE', 'REST_DAY', 'VACATION', 'SICK_LEAVE']),
  startDate: z.string().date(),
  endDate: z.string().date(),
  metadata: z
    .object({
      shiftStart: z.string().regex(timeRegex).optional(),
      shiftEnd: z.string().regex(timeRegex).optional(),
      hours: z.number().min(0).max(24).optional(),
      isNight: z.boolean().optional(),
      reason: z.string().optional()
    })
    .optional()
});

export const scaleCreateSchema = z.object({
  versionLabel: z.string().min(2),
  baseHourlyRate: z.coerce.number().positive(),
  nightMultiplier: z.coerce.number().min(1),
  holidayMultiplier: z.coerce.number().min(1)
});

export const apiKeyCreateSchema = z.object({
  name: z.string().min(2)
});

export const webhookCreateSchema = z.object({
  url: z.string().url(),
  secret: z.string().min(12)
});

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

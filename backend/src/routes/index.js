import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { attendanceController } from '../controllers/attendanceController.js';
import { securityController } from '../controllers/securityController.js';
import { adminController } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { requireApiKey } from '../middlewares/apiKeyMiddleware.js';

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

export const router = Router();

router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/refresh', authLimiter, authController.refresh);
router.post('/auth/recovery', authLimiter, authController.passwordRecovery);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);

router.post('/attendance/generate', requireAuth, requireRole('ADMIN'), attendanceController.generate);
router.post('/salary/calculate', requireAuth, attendanceController.calculateSalary);
router.get('/attendance/:userId/pdf', requireAuth, attendanceController.exportPdf);

router.post('/security/pin', requireAuth, securityController.setPin);
router.post('/security/pin/validate', requireAuth, securityController.validatePin);

router.get('/admin/users', requireAuth, requireRole('ADMIN'), adminController.listUsers);
router.post('/admin/events', requireAuth, requireRole('ADMIN'), adminController.createEvent);
router.post('/admin/scales', requireAuth, requireRole('ADMIN'), adminController.createScale);
router.post('/admin/api-keys', requireAuth, requireRole('ADMIN'), adminController.createApiKey);
router.post('/admin/webhooks', requireAuth, requireRole('ADMIN'), adminController.createWebhook);
router.get('/admin/webhooks', requireAuth, requireRole('ADMIN'), adminController.listWebhooks);

router.post('/internal/webhooks/trigger', requireApiKey, (req, res) => {
  res.json({ accepted: true, payload: req.body });
});

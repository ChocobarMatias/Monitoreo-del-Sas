import { authService } from '../services/authService.js';
import { loginSchema, recoverySchema, registerSchema, resetPasswordSchema } from '../validators/schemas.js';

export const authController = {
  async register(req, res) {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data);
    res.status(201).json({ id: user.id, email: user.email });
  },

  async login(req, res) {
    const data = loginSchema.parse(req.body);
    const session = await authService.login(data.email, data.password);
    res.json(session);
  },

  async refresh(req, res) {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    res.json(tokens);
  },

  async passwordRecovery(req, res) {
    const { email } = recoverySchema.parse(req.body);
    await authService.requestPasswordRecovery(email);
    res.json({ message: 'If the email exists, a recovery message was sent.' });
  },

  async resetPassword(req, res) {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, newPassword);
    res.json({ message: 'Password reset successful' });
  }
};

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
  auth: { user: env.smtpUser, pass: env.smtpPass }
});

const signAccessToken = (user) => jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl });
const signRefreshToken = (user) => jwt.sign({ sub: user.id }, env.jwtRefreshSecret, { expiresIn: env.refreshTokenTtl });

export const authService = {
  async register(payload) {
    const existing = await userRepository.findByEmail(payload.email);
    if (existing) throw new Error('Email already in use');

    const passwordHash = await bcrypt.hash(payload.password, 10);
    return userRepository.create({
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role ?? 'USER',
      passwordHash
    });
  },

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return { accessToken, refreshToken, user };
  },

  async refresh(token) {
    jwt.verify(token, env.jwtRefreshSecret);
    const saved = await prisma.refreshToken.findUnique({ where: { token } });
    if (!saved) throw new Error('Refresh token not found');

    const user = await userRepository.findById(saved.userId);
    return { accessToken: signAccessToken(user) };
  },

  async requestPasswordRecovery(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) return;

    const resetToken = jwt.sign({ sub: user.id, type: 'password-reset' }, env.jwtAccessSecret, { expiresIn: '30m' });
    const resetUrl = `${env.frontendUrl}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: env.smtpUser,
      to: user.email,
      subject: 'Password recovery',
      text: `Reset your password here: ${resetUrl}`
    });
  }
};

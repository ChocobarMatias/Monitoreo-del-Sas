import { prisma } from '../config/prisma.js';

export const userRepository = {
  create: (data) => prisma.user.create({ data }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  setPin: (id, pinHash) => prisma.user.update({ where: { id }, data: { pinHash } })
};

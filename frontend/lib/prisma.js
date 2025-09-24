import { PrismaClient } from './generated/prisma';

let prisma = globalThis.__lingoloopPrisma;

if (!prisma) {
  prisma = new PrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__lingoloopPrisma = prisma;
  }
}

export default prisma;

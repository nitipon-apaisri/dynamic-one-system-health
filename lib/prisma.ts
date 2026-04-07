import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Prisma 6 + Mongo: no Mongo driver adapter exists; URL is env-based (schema + prisma.config.ts). Prisma 7’s adapter/accelerateUrl path is for SQL/Accelerate—Mongo direct is v6-only for now.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

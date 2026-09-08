import { PrismaClient } from '@prisma/client';

// Ensure DATABASE_URL is never an empty string on serverless hosts like Vercel
const fallbackUrl = 'postgresql://postgres:postgres@localhost:5432/yalfal_online_eta?schema=public';
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
  process.env.DATABASE_URL = fallbackUrl;
}

const activeDbUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== ''
  ? process.env.DATABASE_URL
  : fallbackUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


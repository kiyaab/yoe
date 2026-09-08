import { PrismaClient } from '@prisma/client';

// Resolve connection URL from Vercel Supabase integration or standard DATABASE_URL
const fallbackUrl = 'postgresql://postgres:postgres@localhost:5432/yalfal_online_eta?schema=public';

const resolvedDbUrl =
  (process.env.POSTGRES_PRISMA_URL && process.env.POSTGRES_PRISMA_URL.trim() !== '' ? process.env.POSTGRES_PRISMA_URL : null) ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '' ? process.env.DATABASE_URL : null) ||
  (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim() !== '' ? process.env.POSTGRES_URL : null) ||
  (process.env.POSTGRES_URL_NON_POOLING && process.env.POSTGRES_URL_NON_POOLING.trim() !== '' ? process.env.POSTGRES_URL_NON_POOLING : null) ||
  fallbackUrl;

process.env.DATABASE_URL = resolvedDbUrl;
const activeDbUrl = resolvedDbUrl;

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


import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | null | undefined;
};

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    if (!globalForRedis.redisClient) {
      globalForRedis.redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        lazyConnect: true,
      });
      globalForRedis.redisClient.connect().catch(() => {
        // Fallback silently if Redis unavailable
        globalForRedis.redisClient = null;
      });
    }
    redis = globalForRedis.redisClient;
  } catch {
    redis = null;
  }
}

const memoryLockMap = new Map<string, number>();

export async function acquireLock(key: string, ttlSeconds: number = 30): Promise<boolean> {
  if (redis && redis.status === 'ready') {
    try {
      const res = await redis.set(key, 'locked', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch {
      // Fallback to memory
    }
  }

  const now = Date.now();
  const existingExpiry = memoryLockMap.get(key);
  if (existingExpiry && existingExpiry > now) {
    return false;
  }

  memoryLockMap.set(key, now + ttlSeconds * 1000);
  return true;
}

export async function releaseLock(key: string): Promise<void> {
  if (redis && redis.status === 'ready') {
    try {
      await redis.del(key);
      return;
    } catch {
      // Fallback
    }
  }
  memoryLockMap.delete(key);
}

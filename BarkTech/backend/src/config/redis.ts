import Redis from 'ioredis';
import { env } from './env.js';
import pino from 'pino';

const logger = pino({ name: 'redis' });

let redis: Redis.Redis | null = null;

export function getRedis(): Redis.Redis | null {
  if (!env.REDIS_URL) return null;
  if (!redis) {
    const RedisConstructor = Redis as unknown as new (url: string, opts?: Record<string, unknown>) => Redis.Redis;
    redis = new RedisConstructor(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    });
    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err: Error) => logger.error({ err }, 'Redis error'));
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  getRedis();
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

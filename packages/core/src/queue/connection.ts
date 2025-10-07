import { Redis } from 'ioredis';
import type { RedisConfig } from '../config';

/**
 * Redis Connection Manager for BullMQ
 */

let redisConnection: Redis | null = null;

/**
 * Create Redis connection for BullMQ
 */
export function createRedisConnection(config: RedisConfig): Redis {
  return new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    retryStrategy: (times: number) => {
      // Exponential backoff: 2^times * 100ms, max 30s
      const delay = Math.min(Math.pow(2, times) * 100, 30000);
      return delay;
    },
  });
}

/**
 * Get shared Redis connection
 */
export function getRedisConnection(config: RedisConfig): Redis {
  if (!redisConnection) {
    redisConnection = createRedisConnection(config);

    redisConnection.on('error', (err: Error) => {
      console.error('Redis connection error:', err);
    });

    redisConnection.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  return redisConnection;
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}

/**
 * Health check for Redis
 */
export async function isRedisHealthy(
  connection?: Redis
): Promise<boolean> {
  try {
    const redis = connection || redisConnection;
    if (!redis) return false;

    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

import { PrismaClient } from '@prisma/client';
import type { Config } from '../config';

/**
 * Database Client Manager
 *
 * Manages Prisma Client lifecycle with proper connection pooling
 * and graceful shutdown.
 */

let prismaInstance: PrismaClient | null = null;

/**
 * Get Prisma Client instance (singleton)
 */
export function getPrismaClient(config?: Config): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: config?.database.url || process.env.DATABASE_URL,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });

    // Handle connection errors
    prismaInstance.$connect().catch((err) => {
      console.error('Failed to connect to database:', err);
      process.exit(1);
    });
  }

  return prismaInstance;
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

/**
 * Health check for database connection
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Execute raw SQL query (useful for pgvector operations)
 */
export async function executeRawQuery<T = unknown>(
  query: string,
  ...params: unknown[]
): Promise<T> {
  const client = getPrismaClient();
  return client.$queryRawUnsafe<T>(query, ...params);
}

/**
 * Setup graceful shutdown handlers
 */
export function setupDatabaseShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing database connections...`);
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

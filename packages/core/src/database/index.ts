/**
 * Database Module
 *
 * Provides Prisma Client and database utilities
 *
 * Usage:
 * ```typescript
 * import { getPrismaClient, isDatabaseHealthy } from '@mateai/core/database';
 *
 * const prisma = getPrismaClient();
 * const users = await prisma.rawEvent.findMany();
 * ```
 */

export * from './client';

// Re-export Prisma types for convenience
export type {
  PrismaClient,
  RawEvent,
  KnowledgeChunk,
  AgentConversation,
  AgentFeedback,
  ProcessingJob,
} from '@prisma/client';

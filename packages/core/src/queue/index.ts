/**
 * Queue Module
 *
 * Provides BullMQ-based job queue management
 *
 * Usage:
 * ```typescript
 * import { QueueManager, QUEUE_NAMES } from '@mateai/core/queue';
 *
 * const ingestionQueue = new QueueManager(QUEUE_NAMES.INGESTION, { redis: config.redis });
 *
 * // Add job
 * await ingestionQueue.add('slack-message', { ... });
 *
 * // Create worker
 * ingestionQueue.createWorker(async (job) => {
 *   // Process job
 * });
 * ```
 */

export * from './connection';
export * from './manager';
export * from './queues';

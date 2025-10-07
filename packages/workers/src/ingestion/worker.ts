/**
 * Ingestion Worker
 *
 * Receives raw events from adapters and saves them to database
 */

import {
  QueueManager,
  type IngestionJobData,
  QUEUE_NAMES,
  getPrismaClient,
  getLogger,
  type Config,
} from '@mateai/core';
import type { Job } from 'bullmq';

export class IngestionWorker {
  private queue: QueueManager<IngestionJobData, void>;
  private prisma = getPrismaClient();
  private logger = getLogger();

  constructor(config: Config) {
    this.queue = new QueueManager(QUEUE_NAMES.INGESTION, {
      redis: config.redis,
    });

    this.logger.info('Ingestion Worker initialized');
  }

  /**
   * Start the worker
   */
  start(concurrency: number = 5): void {
    this.logger.info({ concurrency }, 'Starting ingestion worker');

    this.queue.createWorker(
      async (job: Job<IngestionJobData>) => {
        return this.processJob(job);
      },
      concurrency
    );
  }

  /**
   * Process a single ingestion job
   */
  private async processJob(job: Job<IngestionJobData>): Promise<void> {
    const { source, eventType, externalId, payload, metadata } = job.data;

    this.logger.debug(
      { jobId: job.id, source, eventType },
      'Processing ingestion job'
    );

    try {
      // Check if event already exists (deduplication)
      if (externalId) {
        const existing = await this.prisma.rawEvent.findFirst({
          where: {
            source,
            externalId,
          },
        });

        if (existing) {
          this.logger.debug(
            { source, externalId },
            'Event already exists, skipping'
          );
          return;
        }
      }

      // Save raw event to database
      const rawEvent = await this.prisma.rawEvent.create({
        data: {
          source,
          eventType,
          externalId,
          payload,
          metadata: metadata || {},
          processingStatus: 'pending',
        },
      });

      this.logger.info(
        { rawEventId: rawEvent.id, source, eventType },
        'Raw event saved'
      );

      // TODO: Enqueue for processing
      // await this.enqueueForProcessing(rawEvent.id);
    } catch (error) {
      this.logger.error(
        { error, source, eventType },
        'Failed to process ingestion job'
      );
      throw error;
    }
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping ingestion worker');
    await this.queue.close();
  }

  /**
   * Add event to ingestion queue
   */
  async addEvent(data: IngestionJobData): Promise<void> {
    await this.queue.add('ingest-event', data);
  }
}

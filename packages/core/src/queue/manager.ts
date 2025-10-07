import { Queue, Worker, type Job, type JobsOptions } from 'bullmq';
import type { Redis } from 'ioredis';
import type { Logger } from 'pino';
import { getRedisConnection } from './connection';
import { createComponentLogger } from '../common/logger';
import type { RedisConfig } from '../config';

/**
 * Queue Manager
 *
 * Manages BullMQ queues and workers
 */

export interface QueueOptions {
  redis: RedisConfig;
  defaultJobOptions?: JobsOptions;
}

export interface WorkerHandler<T = any, R = any> {
  (job: Job<T>): Promise<R>;
}

/**
 * Base Queue Manager
 */
export class QueueManager<T = any, R = any> {
  private queue: Queue<T, R>;
  private worker: Worker<T, R> | null = null;
  private logger: Logger;
  private connection: Redis;
  private queueOptions: QueueOptions;

  constructor(
    public readonly name: string,
    options: QueueOptions
  ) {
    this.queueOptions = options;
    this.logger = createComponentLogger(`queue:${name}`);
    this.connection = getRedisConnection(options.redis);

    // Create queue
    this.queue = new Queue<T, R>(name, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
        ...this.queueOptions.defaultJobOptions,
      },
    });

    this.logger.info(`Queue "${name}" initialized`);
  }

  /**
   * Add job to queue
   */
  async add(
    jobName: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<any, any>> {
    this.logger.debug({ jobName, data }, `Adding job "${jobName}" to queue`);

    const job = await this.queue.add(jobName as any, data as any, options);

    this.logger.info(
      { jobId: job.id, jobName },
      `Job "${jobName}" added with ID ${job.id}`
    );

    return job;
  }

  /**
   * Add multiple jobs in bulk
   */
  async addBulk(
    jobs: Array<{ name: string; data: T; opts?: JobsOptions }>
  ): Promise<Job<any, any>[]> {
    this.logger.debug({ count: jobs.length }, 'Adding bulk jobs to queue');

    const result = await this.queue.addBulk(jobs as any);

    this.logger.info(
      { count: result.length },
      `${result.length} jobs added in bulk`
    );

    return result;
  }

  /**
   * Create and start worker
   */
  createWorker(
    handler: WorkerHandler<T, R>,
    concurrency: number = 1
  ): Worker<T, R> {
    if (this.worker) {
      this.logger.warn('Worker already exists, returning existing worker');
      return this.worker;
    }

    this.worker = new Worker<T, R>(
      this.name,
      async (job: Job<T>) => {
        this.logger.info(
          { jobId: job.id, jobName: job.name },
          `Processing job ${job.id}`
        );

        const start = Date.now();

        try {
          const result = await handler(job);

          const duration = Date.now() - start;
          this.logger.info(
            { jobId: job.id, jobName: job.name, durationMs: duration },
            `Job ${job.id} completed in ${duration}ms`
          );

          return result;
        } catch (error) {
          const duration = Date.now() - start;
          this.logger.error(
            {
              jobId: job.id,
              jobName: job.name,
              error,
              durationMs: duration,
            },
            `Job ${job.id} failed after ${duration}ms`
          );

          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency,
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // Per second
        },
      }
    );

    // Worker event handlers
    this.worker.on('completed', (job) => {
      this.logger.debug({ jobId: job.id }, `Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        { jobId: job?.id, error: err },
        `Job ${job?.id} failed: ${err.message}`
      );
    });

    this.worker.on('error', (err) => {
      this.logger.error({ error: err }, `Worker error: ${err.message}`);
    });

    this.logger.info(
      { concurrency },
      `Worker started with concurrency ${concurrency}`
    );

    return this.worker;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job<any, any> | undefined> {
    return this.queue.getJob(jobId) as Promise<Job<any, any> | undefined>;
  }

  /**
   * Get queue metrics
   */
  async getMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Pause queue
   */
  async pause(): Promise<void> {
    await this.queue.pause();
    this.logger.info('Queue paused');
  }

  /**
   * Resume queue
   */
  async resume(): Promise<void> {
    await this.queue.resume();
    this.logger.info('Queue resumed');
  }

  /**
   * Close queue and worker
   */
  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }

    await this.queue.close();
    this.logger.info('Queue closed');
  }

  /**
   * Get underlying queue instance
   */
  getQueue(): Queue<T, R> {
    return this.queue;
  }

  /**
   * Get underlying worker instance
   */
  getWorker(): Worker<T, R> | null {
    return this.worker;
  }
}

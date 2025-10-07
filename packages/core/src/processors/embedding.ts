/**
 * Embedding Processor
 *
 * Generates vector embeddings for summaries
 */

import crypto from 'crypto';
import type { LLMClient } from '../llm';
import { createComponentLogger } from '../common/logger';
import type { SummarizedEvent } from './summarization';

const logger = createComponentLogger('processor:embedding');

export interface EmbeddedEvent extends SummarizedEvent {
  embedding: number[];
  embeddingModel: string;
  contentHash: string;
}

/**
 * Embedding Processor
 */
export class EmbeddingProcessor {
  constructor(private embeddingClient: LLMClient) {}

  /**
   * Generate embedding for a summarized event
   */
  async embed(summarizedEvent: SummarizedEvent): Promise<EmbeddedEvent> {
    const { rawEvent, summary } = summarizedEvent;

    logger.debug(
      { rawEventId: rawEvent.id },
      'Generating embedding'
    );

    // Generate content hash for deduplication
    const contentHash = this.generateHash(summary);

    try {
      // Generate embedding
      const response = await this.embeddingClient.embed(summary);

      logger.info(
        {
          rawEventId: rawEvent.id,
          dimensions: response.embedding.length,
          contentHash,
        },
        'Embedding generated'
      );

      return {
        ...summarizedEvent,
        embedding: response.embedding,
        embeddingModel: response.model,
        contentHash,
      };
    } catch (error) {
      logger.error(
        { error, rawEventId: rawEvent.id },
        'Failed to generate embedding'
      );
      throw error;
    }
  }

  /**
   * Batch embed multiple summaries
   */
  async embedBatch(
    summarizedEvents: SummarizedEvent[]
  ): Promise<EmbeddedEvent[]> {
    logger.info(
      { count: summarizedEvents.length },
      'Batch generating embeddings'
    );

    try {
      // Extract summaries
      const summaries = summarizedEvents.map((e) => e.summary);

      // Generate embeddings in batch
      const responses = await this.embeddingClient.embedBatch(summaries);

      // Combine results
      return summarizedEvents.map((event, index) => ({
        ...event,
        embedding: responses[index].embedding,
        embeddingModel: responses[index].model,
        contentHash: this.generateHash(event.summary),
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to batch generate embeddings');
      throw error;
    }
  }

  /**
   * Generate SHA-256 hash of content
   */
  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

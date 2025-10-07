/**
 * Memory Service
 *
 * Business logic for memory search and retrieval
 */

import { Injectable } from '@nestjs/common';
import { MemoryRetrievalService, VectorStore, LLMClientManager, loadConfig, getLogger } from '@mateai/core';
import { SearchRequestDto, SearchResponseDto } from '../common/dto/query.dto';

const logger = getLogger();

@Injectable()
export class MemoryService {
  private retrievalService: MemoryRetrievalService;
  private vectorStore: VectorStore;

  constructor() {
    logger.info('Initializing Memory Service');

    const config = loadConfig();
    const llmManager = new LLMClientManager(config.llm);

    // Get embedding client
    const embeddingClient = llmManager.getClient(config.embedding.provider);

    // Initialize vector store and retrieval service
    this.vectorStore = new VectorStore();
    this.retrievalService = new MemoryRetrievalService(this.vectorStore, embeddingClient);

    logger.info('Memory Service initialized');
  }

  /**
   * Search memory with semantic search
   */
  async search(dto: SearchRequestDto): Promise<SearchResponseDto> {
    const startTime = Date.now();

    logger.info({ query: dto.query }, 'Searching memory');

    try {
      const result = await this.retrievalService.search(dto.query, {
        topK: dto.limit || 10,
        minSimilarity: dto.minSimilarity || 0.7,
        sourceType: dto.sourceTypes?.[0], // Use first source type if provided
      });

      const durationMs = Date.now() - startTime;

      logger.info(
        {
          query: dto.query,
          resultsCount: result.chunks.length,
          durationMs,
        },
        'Memory search completed'
      );

      return {
        results: result.chunks.map((chunk) => ({
          id: chunk.id,
          content: chunk.content,
          similarity: chunk.similarity,
          sourceType: chunk.sourceType,
          metadata: chunk.metadata,
          createdAt: chunk.createdAt,
        })),
        total: result.totalResults,
        durationMs,
      };
    } catch (error) {
      logger.error({ error, query: dto.query }, 'Failed to search memory');
      throw error;
    }
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    total: number;
    byTier: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    logger.info('Getting memory statistics');

    try {
      const stats = await this.vectorStore.getStats();

      logger.info({ stats }, 'Memory statistics retrieved');

      return stats;
    } catch (error) {
      logger.error({ error }, 'Failed to get memory statistics');
      throw error;
    }
  }

  /**
   * Get recent events from a specific source
   */
  async getRecent(
    sourceType?: string,
    limit: number = 20
  ): Promise<Array<{
    id: string;
    content: string;
    sourceType: string;
    metadata: Record<string, any>;
    createdAt: Date;
  }>> {
    logger.info({ sourceType, limit }, 'Getting recent events');

    try {
      const chunks = await this.vectorStore.getBySource(sourceType, limit);

      logger.info({ count: chunks.length }, 'Recent events retrieved');

      return chunks.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        sourceType: chunk.sourceType,
        metadata: chunk.metadata as Record<string, any>,
        createdAt: chunk.createdAt,
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to get recent events');
      throw error;
    }
  }
}

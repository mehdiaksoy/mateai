/**
 * Agent Service
 *
 * Business logic for AI agent interactions
 */

import { Injectable } from '@nestjs/common';
import { MemoryRetrievalService, ClaudeSDKAgent, LLMClientManager, loadConfig, getLogger, VectorStore } from '@mateai/core';
import { QueryRequestDto, QueryResponseDto } from '../common/dto/query.dto';

const logger = getLogger();

@Injectable()
export class AgentService {
  private agent: ClaudeSDKAgent;

  constructor() {
    logger.info('Initializing Agent Service');

    const config = loadConfig();
    const llmManager = new LLMClientManager(config.llm);

    // Get embedding client for memory service
    const embeddingClient = llmManager.getClient(config.embedding.provider);
    const vectorStore = new VectorStore();

    // Initialize memory service
    const memoryService = new MemoryRetrievalService(vectorStore, embeddingClient);

    // Create Claude SDK agent
    this.agent = new ClaudeSDKAgent(memoryService, {
      name: 'MateAI',
      description: 'an intelligent AI assistant with access to your team\'s collective knowledge',
    });

    logger.info('Agent Service initialized');
  }

  /**
   * Process user query with AI agent
   */
  async query(dto: QueryRequestDto): Promise<QueryResponseDto> {
    const startTime = Date.now();

    logger.info({ query: dto.query, userId: dto.userId }, 'Processing query');

    try {
      // Process with agent
      const result = await this.agent.process({
        prompt: dto.query,
        userId: dto.userId || 'anonymous',
        includeMemoryContext: dto.includeMemoryContext !== false,
      });

      const durationMs = Date.now() - startTime;

      logger.info(
        {
          userId: dto.userId,
          durationMs,
          steps: result.steps.length,
          responseLength: result.content.length,
        },
        'Query processed successfully'
      );

      return {
        response: result.content,
        durationMs: result.metadata.duration,
        steps: result.steps.length,
      };
    } catch (error) {
      logger.error({ error, query: dto.query }, 'Failed to process query');
      throw error;
    }
  }

  /**
   * Get agent statistics
   */
  async getStats(): Promise<{
    totalQueries: number;
    avgDuration: number;
    uptime: number;
  }> {
    // TODO: Implement proper statistics tracking
    return {
      totalQueries: 0,
      avgDuration: 0,
      uptime: process.uptime(),
    };
  }
}

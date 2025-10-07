/**
 * Agent Service
 *
 * Business logic for AI agent interactions
 */

import { Injectable } from '@nestjs/common';
import {
  MemoryRetrievalService,
  OrchestratorAgent,
  ContextBuilder,
  ToolRegistry,
  createDefaultToolRegistry,
  LLMClientManager,
  loadConfig,
  getLogger,
  VectorStore,
} from '@mateai/core';
import { QueryRequestDto, QueryResponseDto } from '../common/dto/query.dto';

const logger = getLogger();

@Injectable()
export class AgentService {
  private agent: OrchestratorAgent;
  private toolRegistry: ToolRegistry;

  constructor() {
    logger.info('Initializing Agent Service with Native Orchestrator');

    const config = loadConfig();
    const llmManager = new LLMClientManager(config.llm);

    // Get clients
    const llmClient = llmManager.getClient(config.llm.defaultProvider);
    const embeddingClient = llmManager.getClient(config.embedding.provider);
    const vectorStore = new VectorStore();

    // Initialize memory service
    const memoryService = new MemoryRetrievalService(vectorStore, embeddingClient);

    // Initialize context builder
    const contextBuilder = new ContextBuilder(memoryService);

    // Initialize tool registry with memory tools
    this.toolRegistry = createDefaultToolRegistry();
    this.setupMemoryTools(memoryService);

    // Create Orchestrator Agent
    this.agent = new OrchestratorAgent(
      llmClient,
      memoryService,
      contextBuilder,
      this.toolRegistry,
      {
        name: 'MateAI',
        description: 'an intelligent AI assistant with access to your team\'s collective knowledge',
        maxIterations: 5,
        enableTools: true,
        temperature: 0.7,
        maxTokens: 2000,
      }
    );

    logger.info('Agent Service initialized with Native Orchestrator');
  }

  /**
   * Setup memory tools with actual implementations
   */
  private setupMemoryTools(memoryService: MemoryRetrievalService): void {
    // Override search_memory tool with actual implementation
    this.toolRegistry.register({
      name: 'search_memory',
      description: 'Search the knowledge base for relevant information',
      category: 'Memory',
      parameters: [
        {
          name: 'query',
          description: 'The search query',
          type: 'string',
          required: true,
        },
        {
          name: 'limit',
          description: 'Maximum number of results (default: 5)',
          type: 'number',
          required: false,
        },
      ],
      handler: async (params) => {
        try {
          const result = await memoryService.search(params.query, {
            topK: params.limit || 5,
            minSimilarity: 0.65,
          });

          return {
            success: true,
            data: {
              chunks: result.chunks.map((c) => ({
                content: c.content,
                sourceType: c.sourceType,
                similarity: c.similarity,
                metadata: c.metadata,
              })),
              totalResults: result.totalResults,
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Search failed',
          };
        }
      },
    });

    logger.info('Memory tools configured');
  }

  /**
   * Process user query with AI agent
   */
  async query(dto: QueryRequestDto): Promise<QueryResponseDto> {
    const startTime = Date.now();

    logger.info({ query: dto.query, userId: dto.userId }, 'Processing query with Native Orchestrator');

    try {
      // Process with orchestrator agent
      const result = await this.agent.process({
        query: dto.query,
        userId: dto.userId || 'anonymous',
        conversationHistory: [],
        context: { includeMemoryContext: dto.includeMemoryContext !== false },
      });

      const durationMs = Date.now() - startTime;

      logger.info(
        {
          userId: dto.userId,
          durationMs,
          iterations: result.metadata.iterations,
          toolsUsed: result.metadata.toolsUsed,
          tokensUsed: result.metadata.tokensUsed,
          responseLength: result.content.length,
        },
        'Query processed successfully'
      );

      return {
        response: result.content,
        durationMs: result.metadata.duration,
        steps: result.metadata.iterations,
        toolsUsed: result.metadata.toolsUsed,
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

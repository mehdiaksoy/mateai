/**
 * Context Builder
 *
 * Builds context for agent from retrieved knowledge chunks
 */

import type {
  MemoryRetrievalService,
  RetrievedChunk,
  RetrievalResult,
} from '../memory/retrieval-service';
import { createComponentLogger } from '../common/logger';

const logger = createComponentLogger('agent:context-builder');

/**
 * Context building options
 */
export interface ContextOptions {
  /** Maximum tokens for context */
  maxTokens?: number;
  /** Include system prompt */
  includeSystemPrompt?: boolean;
  /** Custom system prompt */
  systemPrompt?: string;
  /** Include conversation history */
  includeHistory?: boolean;
  /** Maximum history messages */
  maxHistory?: number;
  /** Relevance threshold for chunks */
  relevanceThreshold?: number;
}

/**
 * Message in conversation history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * Built context for agent
 */
export interface AgentContext {
  /** System prompt */
  systemPrompt: string;
  /** Retrieved knowledge chunks formatted as context */
  knowledgeContext: string;
  /** Conversation history */
  conversationHistory: ConversationMessage[];
  /** Metadata about context */
  metadata: {
    chunksUsed: number;
    totalTokens: number;
    averageRelevance: number;
    sources: string[];
  };
}

/**
 * Context Builder
 */
export class ContextBuilder {
  private readonly DEFAULT_MAX_TOKENS = 8000;
  private readonly DEFAULT_SYSTEM_PROMPT = `You are MateAI, an intelligent assistant with access to your team's collective knowledge.

You have access to relevant information from your team's conversations, documents, and tools. Use this context to provide accurate, helpful responses.

When answering:
- Reference specific information from the context when relevant
- Acknowledge when you don't have enough information
- Provide actionable insights when possible
- Cite sources when referencing specific information`;

  constructor(private retrievalService: MemoryRetrievalService) {}

  /**
   * Build context for a user query
   */
  async buildContext(
    query: string,
    options: ContextOptions = {},
    conversationHistory: ConversationMessage[] = []
  ): Promise<AgentContext> {
    logger.info({ query, options }, 'Building agent context');

    const maxTokens = options.maxTokens || this.DEFAULT_MAX_TOKENS;

    // Estimate tokens for system prompt and history
    const systemPrompt =
      options.systemPrompt || this.DEFAULT_SYSTEM_PROMPT;
    let usedTokens = this.estimateTokens(systemPrompt);

    // Include conversation history if requested
    let filteredHistory: ConversationMessage[] = [];
    if (options.includeHistory && conversationHistory.length > 0) {
      const maxHistory = options.maxHistory || 10;
      filteredHistory = conversationHistory.slice(-maxHistory);

      const historyTokens = filteredHistory.reduce(
        (sum, msg) => sum + this.estimateTokens(msg.content),
        0
      );
      usedTokens += historyTokens;
    }

    // Calculate remaining tokens for knowledge context
    const remainingTokens = maxTokens - usedTokens - 500; // Reserve 500 for formatting

    logger.debug(
      {
        maxTokens,
        systemTokens: this.estimateTokens(systemPrompt),
        historyTokens: usedTokens - this.estimateTokens(systemPrompt),
        remainingTokens,
      },
      'Token allocation'
    );

    // Retrieve relevant knowledge
    const retrievalResult = await this.retrievalService.search(query, {
      topK: 30,
      minSimilarity: options.relevanceThreshold || 0.6,
    });

    // Select chunks that fit within token budget
    const { selectedChunks, knowledgeContext } = this.selectChunks(
      retrievalResult,
      remainingTokens
    );

    // Calculate metadata
    const sources = Array.from(
      new Set(selectedChunks.map((c) => c.sourceType))
    );
    const averageRelevance =
      selectedChunks.reduce((sum, c) => sum + (c.relevanceScore || c.similarity), 0) /
        selectedChunks.length || 0;

    const totalTokens =
      usedTokens + this.estimateTokens(knowledgeContext);

    logger.info(
      {
        chunksUsed: selectedChunks.length,
        totalTokens,
        avgRelevance: averageRelevance.toFixed(3),
        sources,
      },
      'Context built'
    );

    return {
      systemPrompt,
      knowledgeContext,
      conversationHistory: filteredHistory,
      metadata: {
        chunksUsed: selectedChunks.length,
        totalTokens,
        averageRelevance,
        sources,
      },
    };
  }

  /**
   * Build context from specific chunk IDs
   */
  async buildContextFromChunks(
    chunkIds: string[],
    options: ContextOptions = {}
  ): Promise<AgentContext> {
    logger.debug({ chunkIds }, 'Building context from specific chunks');

    const chunks = await this.retrievalService.getByIds(chunkIds);
    const maxTokens = options.maxTokens || this.DEFAULT_MAX_TOKENS;
    const systemPrompt =
      options.systemPrompt || this.DEFAULT_SYSTEM_PROMPT;

    const { selectedChunks, knowledgeContext } = this.selectChunks(
      { chunks, totalResults: chunks.length } as RetrievalResult,
      maxTokens - this.estimateTokens(systemPrompt) - 500
    );

    const sources = Array.from(
      new Set(selectedChunks.map((c) => c.sourceType))
    );

    return {
      systemPrompt,
      knowledgeContext,
      conversationHistory: [],
      metadata: {
        chunksUsed: selectedChunks.length,
        totalTokens: this.estimateTokens(systemPrompt) + this.estimateTokens(knowledgeContext),
        averageRelevance: 1.0,
        sources,
      },
    };
  }

  /**
   * Format context as prompt for LLM
   */
  formatAsPrompt(context: AgentContext, userQuery: string): string {
    const parts: string[] = [];

    // System prompt
    parts.push(context.systemPrompt);
    parts.push('');

    // Knowledge context
    if (context.knowledgeContext) {
      parts.push('## Relevant Context');
      parts.push('');
      parts.push(context.knowledgeContext);
      parts.push('');
    }

    // Conversation history
    if (context.conversationHistory.length > 0) {
      parts.push('## Conversation History');
      parts.push('');
      context.conversationHistory.forEach((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        parts.push(`${role}: ${msg.content}`);
      });
      parts.push('');
    }

    // Current query
    parts.push('## Current Query');
    parts.push('');
    parts.push(`User: ${userQuery}`);
    parts.push('');
    parts.push('Assistant:');

    return parts.join('\n');
  }

  /**
   * Select chunks that fit within token budget
   */
  private selectChunks(
    retrievalResult: RetrievalResult,
    maxTokens: number
  ): { selectedChunks: RetrievedChunk[]; knowledgeContext: string } {
    const chunks = retrievalResult.chunks;
    const selectedChunks: RetrievedChunk[] = [];
    const contextParts: string[] = [];
    let usedTokens = 0;

    for (const chunk of chunks) {
      // Format chunk
      const formattedChunk = this.formatChunk(chunk);
      const chunkTokens = this.estimateTokens(formattedChunk);

      // Check if adding this chunk would exceed budget
      if (usedTokens + chunkTokens > maxTokens) {
        logger.debug(
          { selectedCount: selectedChunks.length, usedTokens },
          'Token budget reached'
        );
        break;
      }

      selectedChunks.push(chunk);
      contextParts.push(formattedChunk);
      usedTokens += chunkTokens;
    }

    return {
      selectedChunks,
      knowledgeContext: contextParts.join('\n\n---\n\n'),
    };
  }

  /**
   * Format a chunk for context
   */
  private formatChunk(chunk: RetrievedChunk): string {
    const parts: string[] = [];

    // Source metadata
    parts.push(
      `[Source: ${chunk.sourceType} | Relevance: ${((chunk.relevanceScore || chunk.similarity) * 100).toFixed(1)}%]`
    );

    // Content
    parts.push(chunk.content);

    // Additional metadata if available
    if (chunk.metadata && Object.keys(chunk.metadata).length > 0) {
      const metadataStr = Object.entries(chunk.metadata)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

      if (metadataStr) {
        parts.push(`\nMetadata: ${metadataStr}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Estimate token count for text
   * Simple estimation: ~4 characters per token
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Add system instructions to context
   */
  addSystemInstructions(
    context: AgentContext,
    instructions: string
  ): AgentContext {
    return {
      ...context,
      systemPrompt: `${context.systemPrompt}\n\n${instructions}`,
      metadata: {
        ...context.metadata,
        totalTokens:
          context.metadata.totalTokens + this.estimateTokens(instructions),
      },
    };
  }

  /**
   * Get context summary
   */
  summarizeContext(context: AgentContext): string {
    const { metadata } = context;
    return `Context: ${metadata.chunksUsed} chunks from ${metadata.sources.join(', ')} (${metadata.totalTokens} tokens, ${(metadata.averageRelevance * 100).toFixed(1)}% avg relevance)`;
  }
}

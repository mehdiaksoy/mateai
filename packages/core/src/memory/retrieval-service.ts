/**
 * Memory Retrieval Service
 *
 * High-level service for semantic search and knowledge retrieval
 */

import type { LLMClient } from '../llm';
import type { VectorStore, SearchOptions, SearchResult } from './vector-store';
import { createComponentLogger } from '../common/logger';

const logger = createComponentLogger('memory:retrieval');

/**
 * Retrieval options
 */
export interface RetrievalOptions {
  /** Maximum number of results to return */
  topK?: number;
  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number;
  /** Filter by source type */
  sourceType?: string;
  /** Filter by tiers */
  tiers?: ('hot' | 'warm' | 'cold')[];
  /** Rerank results using LLM */
  rerank?: boolean;
}

/**
 * Retrieved knowledge chunk with metadata
 */
export interface RetrievedChunk {
  id: string;
  content: string;
  summary?: string;
  sourceType: string;
  sourceId: string;
  metadata: Record<string, any>;
  similarity: number;
  importanceScore?: number;
  relevanceScore?: number; // Combined similarity + importance
  accessCount: number;
  createdAt: Date;
}

/**
 * Retrieval result with context
 */
export interface RetrievalResult {
  chunks: RetrievedChunk[];
  query: string;
  totalResults: number;
  averageSimilarity: number;
  retrievedAt: Date;
}

/**
 * Memory Retrieval Service
 */
export class MemoryRetrievalService {
  constructor(
    private vectorStore: VectorStore,
    private embeddingClient: LLMClient,
    private rerankClient?: LLMClient
  ) {}

  /**
   * Search for relevant knowledge chunks
   */
  async search(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult> {
    logger.info({ query, options }, 'Searching knowledge base');

    // Generate query embedding
    const queryStart = Date.now();
    const embeddingResponse = await this.embeddingClient.embed(query);
    const queryEmbedding = embeddingResponse.embedding;
    logger.debug(
      { duration: Date.now() - queryStart },
      'Query embedding generated'
    );

    // Search vector store
    const searchOptions: SearchOptions = {
      topK: options.topK || 20,
      similarityThreshold: options.minSimilarity || 0.5,
      sourceTypes: options.sourceType ? [options.sourceType] : undefined,
      tiers: options.tiers || ['hot', 'warm'],
    };

    const searchStart = Date.now();
    const searchResults = await this.vectorStore.search(
      queryEmbedding,
      searchOptions
    );
    logger.debug(
      { duration: Date.now() - searchStart, results: searchResults.length },
      'Vector search completed'
    );

    // Convert to retrieved chunks
    let chunks = this.mapToRetrievedChunks(searchResults);

    // Calculate relevance scores
    chunks = this.calculateRelevanceScores(chunks);

    // Rerank if requested
    if (options.rerank && this.rerankClient && chunks.length > 0) {
      chunks = await this.rerankResults(query, chunks);
    }

    // Calculate metrics
    const averageSimilarity =
      chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length || 0;

    logger.info(
      {
        results: chunks.length,
        avgSimilarity: averageSimilarity.toFixed(3),
      },
      'Search completed'
    );

    return {
      chunks,
      query,
      totalResults: chunks.length,
      averageSimilarity,
      retrievedAt: new Date(),
    };
  }

  /**
   * Retrieve specific chunks by IDs
   */
  async getByIds(ids: string[]): Promise<RetrievedChunk[]> {
    logger.debug({ ids }, 'Retrieving chunks by IDs');

    const chunks = await Promise.all(
      ids.map((id) => this.vectorStore.getById(id))
    );
    const validChunks = chunks.filter((c) => c !== null);

    return this.mapToRetrievedChunks(
      validChunks.map((c) => ({ chunk: c, similarity: 1.0 }))
    );
  }

  /**
   * Get recent chunks from a source
   */
  async getRecent(
    sourceType: string,
    limit = 10
  ): Promise<RetrievedChunk[]> {
    logger.debug({ sourceType, limit }, 'Retrieving recent chunks');

    // Use getBySource from vector store
    const chunks = await this.vectorStore.getBySource(sourceType, limit);

    return this.mapToRetrievedChunks(
      chunks.map((c) => ({ chunk: c, similarity: 1.0 }))
    );
  }

  /**
   * Find similar chunks to a given chunk
   */
  async findSimilar(
    chunkId: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult> {
    logger.debug({ chunkId }, 'Finding similar chunks');

    // Get the chunk
    const chunk = await this.vectorStore.getById(chunkId);
    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkId}`);
    }

    // Extract embedding (Prisma doesn't type unsupported columns)
    const chunkWithEmbedding = chunk as typeof chunk & { embedding?: number[] };
    if (!chunkWithEmbedding.embedding) {
      throw new Error(`Chunk has no embedding: ${chunkId}`);
    }

    // Search with the chunk's embedding
    const searchOptions: SearchOptions = {
      topK: options.topK || 20,
      similarityThreshold: options.minSimilarity || 0.7,
      sourceTypes: options.sourceType ? [options.sourceType] : undefined,
      tiers: options.tiers || ['hot', 'warm'],
    };

    const searchResults = await this.vectorStore.search(
      chunkWithEmbedding.embedding,
      searchOptions
    );

    // Filter out the original chunk
    const filteredResults = searchResults.filter(
      (r) => r.chunk.id !== chunkId
    );

    // Convert to retrieved chunks
    const retrievedChunks = this.mapToRetrievedChunks(filteredResults);

    const averageSimilarity =
      retrievedChunks.reduce((sum, c) => sum + c.similarity, 0) /
        retrievedChunks.length || 0;

    return {
      chunks: retrievedChunks,
      query: `Similar to: ${chunk.content.substring(0, 100)}...`,
      totalResults: retrievedChunks.length,
      averageSimilarity,
      retrievedAt: new Date(),
    };
  }

  /**
   * Map search results to retrieved chunks
   */
  private mapToRetrievedChunks(results: SearchResult[]): RetrievedChunk[] {
    return results.map((result) => ({
      id: result.chunk.id,
      content: result.chunk.content,
      sourceType: result.chunk.sourceType,
      sourceId: result.chunk.sourceId,
      metadata: result.chunk.metadata as Record<string, any>,
      similarity: result.similarity,
      importanceScore: result.chunk.importanceScore || undefined,
      accessCount: result.chunk.accessCount,
      createdAt: result.chunk.createdAt,
    }));
  }

  /**
   * Calculate relevance scores combining similarity and importance
   */
  private calculateRelevanceScores(
    chunks: RetrievedChunk[]
  ): RetrievedChunk[] {
    return chunks.map((chunk) => {
      // Weighted combination: 70% similarity, 30% importance
      const relevanceScore =
        chunk.similarity * 0.7 +
        (chunk.importanceScore || 0.5) * 0.3;

      return {
        ...chunk,
        relevanceScore,
      };
    });
  }

  /**
   * Rerank results using LLM
   */
  private async rerankResults(
    query: string,
    chunks: RetrievedChunk[]
  ): Promise<RetrievedChunk[]> {
    logger.debug({ count: chunks.length }, 'Reranking results with LLM');

    // Take top N for reranking (expensive operation)
    const topN = Math.min(chunks.length, 10);
    const toRerank = chunks.slice(0, topN);
    const rest = chunks.slice(topN);

    try {
      const prompt = this.buildRerankPrompt(query, toRerank);
      const response = await this.rerankClient!.complete(prompt, {
        maxTokens: 500,
        temperature: 0,
      });

      // Parse response to get ranking
      const ranking = this.parseRankingResponse(response.content);

      // Reorder chunks based on ranking
      const reranked = ranking
        .map((index) => toRerank[index])
        .filter((c) => c !== undefined);

      // Add any chunks that weren't ranked
      const rankedIds = new Set(reranked.map((c) => c.id));
      const unranked = toRerank.filter((c) => !rankedIds.has(c.id));

      logger.info({ reranked: reranked.length }, 'Reranking completed');

      return [...reranked, ...unranked, ...rest];
    } catch (error) {
      logger.error({ error }, 'Reranking failed, returning original order');
      return chunks;
    }
  }

  /**
   * Build prompt for reranking
   */
  private buildRerankPrompt(
    query: string,
    chunks: RetrievedChunk[]
  ): string {
    const chunksText = chunks
      .map(
        (c, i) =>
          `[${i}] ${c.content.substring(0, 200)}${c.content.length > 200 ? '...' : ''}`
      )
      .join('\n\n');

    return `You are a relevance ranker. Given a query and a list of knowledge chunks, rank them by relevance.

Query: "${query}"

Chunks:
${chunksText}

Task: Return ONLY the indices of the chunks in order of relevance (most relevant first), as a comma-separated list.
Example response: 2,0,4,1,3

Response:`;
  }

  /**
   * Parse ranking response
   */
  private parseRankingResponse(response: string): number[] {
    try {
      // Extract numbers from response
      const matches = response.match(/\d+/g);
      if (!matches) return [];

      return matches.map((m) => parseInt(m, 10));
    } catch {
      return [];
    }
  }
}

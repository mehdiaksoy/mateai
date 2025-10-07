/**
 * Vector Store
 *
 * Storage and retrieval of knowledge chunks with vector search
 */

import { getPrismaClient } from '../database';
import { createComponentLogger } from '../common/logger';
import type { KnowledgeChunk } from '@prisma/client';

const logger = createComponentLogger('memory:vector-store');

export interface StoreChunkData {
  content: string;
  contentHash: string;
  sourceType: string;
  sourceId: string;
  metadata: Record<string, any>;
  importanceScore: number;
  embedding: number[];
  embeddingModel: string;
}

export interface SearchOptions {
  topK?: number;
  similarityThreshold?: number;
  sourceTypes?: string[];
  tiers?: string[];
}

export interface SearchResult {
  chunk: KnowledgeChunk;
  similarity: number;
}

/**
 * Vector Store for Knowledge Chunks
 */
export class VectorStore {
  private prisma = getPrismaClient();

  /**
   * Store a knowledge chunk with embedding
   */
  async store(data: StoreChunkData): Promise<KnowledgeChunk> {
    logger.debug({ sourceId: data.sourceId }, 'Storing knowledge chunk');

    try {
      // Check for duplicate based on content hash
      const existing = await this.prisma.knowledgeChunk.findUnique({
        where: { contentHash: data.contentHash },
      });

      if (existing) {
        logger.info(
          { chunkId: existing.id, contentHash: data.contentHash },
          'Chunk already exists, skipping'
        );
        return existing;
      }

      // Store chunk using raw SQL for vector type
      const result = await this.prisma.$queryRaw<KnowledgeChunk[]>`
        INSERT INTO knowledge_chunks (
          id,
          content,
          content_hash,
          source_type,
          source_id,
          metadata,
          importance_score,
          embedding,
          embedding_model,
          tier,
          access_count,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          ${data.content},
          ${data.contentHash},
          ${data.sourceType},
          ${data.sourceId}::uuid,
          ${JSON.stringify(data.metadata)}::jsonb,
          ${data.importanceScore},
          ${`[${data.embedding.join(',')}]`}::vector,
          ${data.embeddingModel},
          'hot',
          0,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          content,
          content_hash,
          source_type,
          source_id,
          metadata,
          importance_score,
          embedding::text as embedding,
          embedding_model,
          tier,
          access_count,
          last_accessed_at,
          created_at,
          updated_at
      `;

      const chunk = result[0];

      logger.info(
        { chunkId: chunk.id, sourceType: data.sourceType },
        'Knowledge chunk stored'
      );

      return chunk;
    } catch (error) {
      logger.error({ error }, 'Failed to store knowledge chunk');
      throw error;
    }
  }

  /**
   * Search for similar knowledge chunks using vector similarity
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      topK = 20,
      similarityThreshold = 0.7,
      sourceTypes,
      tiers = ['hot', 'warm'],
    } = options;

    logger.debug({ topK, similarityThreshold }, 'Searching knowledge chunks');

    try {
      // Build base query with filters
      const tierFilter = tiers.map(t => `'${t}'`).join(',');
      const sourceFilter = sourceTypes && sourceTypes.length > 0
        ? `AND source_type = ANY(ARRAY[${sourceTypes.map(t => `'${t}'`).join(',')}]::text[])`
        : '';

      const vectorString = `[${queryEmbedding.join(',')}]`;

      // Perform vector similarity search using cosine distance
      const query = `
        SELECT
          id,
          content,
          content_hash,
          source_type,
          source_id,
          metadata,
          importance_score,
          embedding::text as embedding,
          embedding_model,
          tier,
          access_count,
          last_accessed_at,
          created_at,
          updated_at,
          1 - (embedding <=> '${vectorString}'::vector) as similarity
        FROM knowledge_chunks
        WHERE embedding IS NOT NULL
          AND tier = ANY(ARRAY[${tierFilter}]::text[])
          ${sourceFilter}
          AND 1 - (embedding <=> '${vectorString}'::vector) >= ${similarityThreshold}
        ORDER BY embedding <=> '${vectorString}'::vector
        LIMIT ${topK}
      `;

      const results = await this.prisma.$queryRawUnsafe<Array<KnowledgeChunk & { similarity: number }>>(query);

      logger.info({ resultCount: results.length }, 'Search completed');

      // Update access stats for retrieved chunks
      if (results.length > 0) {
        const chunkIds = results.map((r) => r.id);
        await this.updateAccessStats(chunkIds);
      }

      return results.map((r) => ({
        chunk: r,
        similarity: r.similarity,
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to search knowledge chunks');
      throw error;
    }
  }

  /**
   * Get chunk by ID
   */
  async getById(id: string): Promise<KnowledgeChunk | null> {
    const chunk = await this.prisma.knowledgeChunk.findUnique({
      where: { id },
    });

    if (chunk) {
      await this.updateAccessStats([id]);
    }

    return chunk;
  }

  /**
   * Update access statistics for chunks
   */
  private async updateAccessStats(chunkIds: string[]): Promise<void> {
    try {
      await this.prisma.knowledgeChunk.updateMany({
        where: {
          id: { in: chunkIds },
        },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });
    } catch (error) {
      logger.warn({ error }, 'Failed to update access stats');
    }
  }

  /**
   * Get chunks by source (if sourceType is provided), otherwise get all chunks
   */
  async getBySource(sourceType?: string, limit: number = 100): Promise<KnowledgeChunk[]> {
    return this.prisma.knowledgeChunk.findMany({
      where: sourceType ? { sourceType } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    byTier: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const [total, tierCounts, sourceCounts] = await Promise.all([
      this.prisma.knowledgeChunk.count(),
      this.prisma.knowledgeChunk.groupBy({
        by: ['tier'],
        _count: true,
      }),
      this.prisma.knowledgeChunk.groupBy({
        by: ['sourceType'],
        _count: true,
      }),
    ]);

    return {
      total,
      byTier: Object.fromEntries(tierCounts.map((t) => [t.tier, t._count])),
      bySource: Object.fromEntries(sourceCounts.map((s) => [s.sourceType, s._count])),
    };
  }
}

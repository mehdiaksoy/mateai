"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStore = void 0;
const database_1 = require("../database");
const logger_1 = require("../common/logger");
const logger = (0, logger_1.createComponentLogger)('memory:vector-store');
class VectorStore {
    prisma = (0, database_1.getPrismaClient)();
    async store(data) {
        logger.debug({ sourceId: data.sourceId }, 'Storing knowledge chunk');
        try {
            const existing = await this.prisma.knowledgeChunk.findUnique({
                where: { contentHash: data.contentHash },
            });
            if (existing) {
                logger.info({ chunkId: existing.id, contentHash: data.contentHash }, 'Chunk already exists, skipping');
                return existing;
            }
            const result = await this.prisma.$queryRaw `
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
            logger.info({ chunkId: chunk.id, sourceType: data.sourceType }, 'Knowledge chunk stored');
            return chunk;
        }
        catch (error) {
            logger.error({ error }, 'Failed to store knowledge chunk');
            throw error;
        }
    }
    async search(queryEmbedding, options = {}) {
        const { topK = 20, similarityThreshold = 0.7, sourceTypes, tiers = ['hot', 'warm'], } = options;
        logger.debug({ topK, similarityThreshold }, 'Searching knowledge chunks');
        try {
            const tierFilter = tiers.map(t => `'${t}'`).join(',');
            const sourceFilter = sourceTypes && sourceTypes.length > 0
                ? `AND source_type = ANY(ARRAY[${sourceTypes.map(t => `'${t}'`).join(',')}]::text[])`
                : '';
            const vectorString = `[${queryEmbedding.join(',')}]`;
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
            const results = await this.prisma.$queryRawUnsafe(query);
            logger.info({ resultCount: results.length }, 'Search completed');
            if (results.length > 0) {
                const chunkIds = results.map((r) => r.id);
                await this.updateAccessStats(chunkIds);
            }
            return results.map((r) => ({
                chunk: r,
                similarity: r.similarity,
            }));
        }
        catch (error) {
            logger.error({ error }, 'Failed to search knowledge chunks');
            throw error;
        }
    }
    async getById(id) {
        const chunk = await this.prisma.knowledgeChunk.findUnique({
            where: { id },
        });
        if (chunk) {
            await this.updateAccessStats([id]);
        }
        return chunk;
    }
    async updateAccessStats(chunkIds) {
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
        }
        catch (error) {
            logger.warn({ error }, 'Failed to update access stats');
        }
    }
    async getBySource(sourceType, limit = 100) {
        return this.prisma.knowledgeChunk.findMany({
            where: { sourceType },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getStats() {
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
exports.VectorStore = VectorStore;
//# sourceMappingURL=vector-store.js.map
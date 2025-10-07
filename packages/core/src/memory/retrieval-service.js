"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryRetrievalService = void 0;
const logger_1 = require("../common/logger");
const logger = (0, logger_1.createComponentLogger)('memory:retrieval');
class MemoryRetrievalService {
    vectorStore;
    embeddingClient;
    rerankClient;
    constructor(vectorStore, embeddingClient, rerankClient) {
        this.vectorStore = vectorStore;
        this.embeddingClient = embeddingClient;
        this.rerankClient = rerankClient;
    }
    async search(query, options = {}) {
        logger.info({ query, options }, 'Searching knowledge base');
        const queryStart = Date.now();
        const embeddingResponse = await this.embeddingClient.embed(query);
        const queryEmbedding = embeddingResponse.embedding;
        logger.debug({ duration: Date.now() - queryStart }, 'Query embedding generated');
        const searchOptions = {
            topK: options.topK || 20,
            similarityThreshold: options.minSimilarity || 0.5,
            sourceTypes: options.sourceType ? [options.sourceType] : undefined,
            tiers: options.tiers || ['hot', 'warm'],
        };
        const searchStart = Date.now();
        const searchResults = await this.vectorStore.search(queryEmbedding, searchOptions);
        logger.debug({ duration: Date.now() - searchStart, results: searchResults.length }, 'Vector search completed');
        let chunks = this.mapToRetrievedChunks(searchResults);
        chunks = this.calculateRelevanceScores(chunks);
        if (options.rerank && this.rerankClient && chunks.length > 0) {
            chunks = await this.rerankResults(query, chunks);
        }
        const averageSimilarity = chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length || 0;
        logger.info({
            results: chunks.length,
            avgSimilarity: averageSimilarity.toFixed(3),
        }, 'Search completed');
        return {
            chunks,
            query,
            totalResults: chunks.length,
            averageSimilarity,
            retrievedAt: new Date(),
        };
    }
    async getByIds(ids) {
        logger.debug({ ids }, 'Retrieving chunks by IDs');
        const chunks = await Promise.all(ids.map((id) => this.vectorStore.getById(id)));
        const validChunks = chunks.filter((c) => c !== null);
        return this.mapToRetrievedChunks(validChunks.map((c) => ({ chunk: c, similarity: 1.0 })));
    }
    async getRecent(sourceType, limit = 10) {
        logger.debug({ sourceType, limit }, 'Retrieving recent chunks');
        const chunks = await this.vectorStore.getBySource(sourceType, limit);
        return this.mapToRetrievedChunks(chunks.map((c) => ({ chunk: c, similarity: 1.0 })));
    }
    async findSimilar(chunkId, options = {}) {
        logger.debug({ chunkId }, 'Finding similar chunks');
        const chunk = await this.vectorStore.getById(chunkId);
        if (!chunk) {
            throw new Error(`Chunk not found: ${chunkId}`);
        }
        const chunkWithEmbedding = chunk;
        if (!chunkWithEmbedding.embedding) {
            throw new Error(`Chunk has no embedding: ${chunkId}`);
        }
        const searchOptions = {
            topK: options.topK || 20,
            similarityThreshold: options.minSimilarity || 0.7,
            sourceTypes: options.sourceType ? [options.sourceType] : undefined,
            tiers: options.tiers || ['hot', 'warm'],
        };
        const searchResults = await this.vectorStore.search(chunkWithEmbedding.embedding, searchOptions);
        const filteredResults = searchResults.filter((r) => r.chunk.id !== chunkId);
        const retrievedChunks = this.mapToRetrievedChunks(filteredResults);
        const averageSimilarity = retrievedChunks.reduce((sum, c) => sum + c.similarity, 0) /
            retrievedChunks.length || 0;
        return {
            chunks: retrievedChunks,
            query: `Similar to: ${chunk.content.substring(0, 100)}...`,
            totalResults: retrievedChunks.length,
            averageSimilarity,
            retrievedAt: new Date(),
        };
    }
    mapToRetrievedChunks(results) {
        return results.map((result) => ({
            id: result.chunk.id,
            content: result.chunk.content,
            sourceType: result.chunk.sourceType,
            sourceId: result.chunk.sourceId,
            metadata: result.chunk.metadata,
            similarity: result.similarity,
            importanceScore: result.chunk.importanceScore || undefined,
            accessCount: result.chunk.accessCount,
            createdAt: result.chunk.createdAt,
        }));
    }
    calculateRelevanceScores(chunks) {
        return chunks.map((chunk) => {
            const relevanceScore = chunk.similarity * 0.7 +
                (chunk.importanceScore || 0.5) * 0.3;
            return {
                ...chunk,
                relevanceScore,
            };
        });
    }
    async rerankResults(query, chunks) {
        logger.debug({ count: chunks.length }, 'Reranking results with LLM');
        const topN = Math.min(chunks.length, 10);
        const toRerank = chunks.slice(0, topN);
        const rest = chunks.slice(topN);
        try {
            const prompt = this.buildRerankPrompt(query, toRerank);
            const response = await this.rerankClient.complete(prompt, {
                maxTokens: 500,
                temperature: 0,
            });
            const ranking = this.parseRankingResponse(response.content);
            const reranked = ranking
                .map((index) => toRerank[index])
                .filter((c) => c !== undefined);
            const rankedIds = new Set(reranked.map((c) => c.id));
            const unranked = toRerank.filter((c) => !rankedIds.has(c.id));
            logger.info({ reranked: reranked.length }, 'Reranking completed');
            return [...reranked, ...unranked, ...rest];
        }
        catch (error) {
            logger.error({ error }, 'Reranking failed, returning original order');
            return chunks;
        }
    }
    buildRerankPrompt(query, chunks) {
        const chunksText = chunks
            .map((c, i) => `[${i}] ${c.content.substring(0, 200)}${c.content.length > 200 ? '...' : ''}`)
            .join('\n\n');
        return `You are a relevance ranker. Given a query and a list of knowledge chunks, rank them by relevance.

Query: "${query}"

Chunks:
${chunksText}

Task: Return ONLY the indices of the chunks in order of relevance (most relevant first), as a comma-separated list.
Example response: 2,0,4,1,3

Response:`;
    }
    parseRankingResponse(response) {
        try {
            const matches = response.match(/\d+/g);
            if (!matches)
                return [];
            return matches.map((m) => parseInt(m, 10));
        }
        catch {
            return [];
        }
    }
}
exports.MemoryRetrievalService = MemoryRetrievalService;
//# sourceMappingURL=retrieval-service.js.map
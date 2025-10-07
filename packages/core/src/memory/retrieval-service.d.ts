import type { LLMClient } from '../llm';
import type { VectorStore } from './vector-store';
export interface RetrievalOptions {
    topK?: number;
    minSimilarity?: number;
    sourceType?: string;
    tiers?: ('hot' | 'warm' | 'cold')[];
    rerank?: boolean;
}
export interface RetrievedChunk {
    id: string;
    content: string;
    summary?: string;
    sourceType: string;
    sourceId: string;
    metadata: Record<string, any>;
    similarity: number;
    importanceScore?: number;
    relevanceScore?: number;
    accessCount: number;
    createdAt: Date;
}
export interface RetrievalResult {
    chunks: RetrievedChunk[];
    query: string;
    totalResults: number;
    averageSimilarity: number;
    retrievedAt: Date;
}
export declare class MemoryRetrievalService {
    private vectorStore;
    private embeddingClient;
    private rerankClient?;
    constructor(vectorStore: VectorStore, embeddingClient: LLMClient, rerankClient?: LLMClient | undefined);
    search(query: string, options?: RetrievalOptions): Promise<RetrievalResult>;
    getByIds(ids: string[]): Promise<RetrievedChunk[]>;
    getRecent(sourceType: string, limit?: number): Promise<RetrievedChunk[]>;
    findSimilar(chunkId: string, options?: RetrievalOptions): Promise<RetrievalResult>;
    private mapToRetrievedChunks;
    private calculateRelevanceScores;
    private rerankResults;
    private buildRerankPrompt;
    private parseRankingResponse;
}
//# sourceMappingURL=retrieval-service.d.ts.map
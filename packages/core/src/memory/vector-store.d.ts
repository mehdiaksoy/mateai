import type { KnowledgeChunk } from '@prisma/client';
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
export declare class VectorStore {
    private prisma;
    store(data: StoreChunkData): Promise<KnowledgeChunk>;
    search(queryEmbedding: number[], options?: SearchOptions): Promise<SearchResult[]>;
    getById(id: string): Promise<KnowledgeChunk | null>;
    private updateAccessStats;
    getBySource(sourceType: string, limit?: number): Promise<KnowledgeChunk[]>;
    getStats(): Promise<{
        total: number;
        byTier: Record<string, number>;
        bySource: Record<string, number>;
    }>;
}
//# sourceMappingURL=vector-store.d.ts.map
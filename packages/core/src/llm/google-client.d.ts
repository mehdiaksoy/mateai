import type { LLMClient, ChatMessage, CompletionOptions, CompletionResponse, EmbeddingResponse } from './types';
export declare class GoogleClient implements LLMClient {
    private client;
    private logger;
    private model;
    private embeddingModel;
    private maxTokens;
    private temperature;
    constructor(config: {
        apiKey: string;
        model?: string;
        embeddingModel?: string;
        maxTokens?: number;
        temperature?: number;
    });
    complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
    chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    embed(text: string): Promise<EmbeddingResponse>;
    embedBatch(texts: string[]): Promise<EmbeddingResponse[]>;
    countTokens(text: string): Promise<number>;
    private handleError;
}
//# sourceMappingURL=google-client.d.ts.map
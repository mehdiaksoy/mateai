import type { LLMClient, ChatMessage, CompletionOptions, CompletionResponse, EmbeddingResponse } from './types';
export declare class AnthropicClient implements LLMClient {
    private client;
    private logger;
    private model;
    private maxTokens;
    private temperature;
    constructor(config: {
        apiKey: string;
        model?: string;
        maxTokens?: number;
        temperature?: number;
    });
    complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
    chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    embed(_text: string): Promise<EmbeddingResponse>;
    embedBatch(_texts: string[]): Promise<EmbeddingResponse[]>;
    countTokens(text: string): Promise<number>;
    private handleError;
}
//# sourceMappingURL=anthropic-client.d.ts.map
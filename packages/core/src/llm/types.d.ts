export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | ToolUseContent[];
    tool_call_id?: string;
}
export interface ToolUseContent {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, any>;
}
export interface CompletionOptions {
    maxTokens?: number;
    temperature?: number;
    stopSequences?: string[];
    tools?: Tool[];
}
export interface Tool {
    name: string;
    description: string;
    input_schema: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
        }>;
        required?: string[];
    };
}
export interface CompletionResponse {
    content: string;
    tokensUsed: number;
    model: string;
    finishReason?: string;
    toolCalls?: ToolCall[];
}
export interface ToolCall {
    id: string;
    name: string;
    input: Record<string, any>;
}
export interface EmbeddingResponse {
    embedding: number[];
    tokensUsed: number;
    model: string;
}
export interface LLMClient {
    complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
    chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    embed(text: string): Promise<EmbeddingResponse>;
    embedBatch(texts: string[]): Promise<EmbeddingResponse[]>;
    countTokens(text: string): Promise<number>;
}
export type LLMProviderType = 'anthropic' | 'openai' | 'google';
export declare class LLMError extends Error {
    provider: LLMProviderType;
    cause?: Error | undefined;
    constructor(message: string, provider: LLMProviderType, cause?: Error | undefined);
}
export declare class LLMRateLimitError extends LLMError {
    constructor(provider: LLMProviderType, retryAfter?: number);
    retryAfter?: number;
}
export declare class LLMAuthError extends LLMError {
    constructor(provider: LLMProviderType);
}
//# sourceMappingURL=types.d.ts.map
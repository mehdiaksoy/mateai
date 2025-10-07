/**
 * LLM Integration Types
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ToolUseContent[];
  tool_call_id?: string;
}

/**
 * Tool use content block
 */
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

/**
 * Tool definition for function calling
 */
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

/**
 * Tool call from LLM
 */
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

/**
 * Base LLM Client Interface
 */
export interface LLMClient {
  /**
   * Generate text completion
   */
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;

  /**
   * Generate chat completion
   */
  chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;

  /**
   * Generate embeddings for text
   */
  embed(text: string): Promise<EmbeddingResponse>;

  /**
   * Generate embeddings for multiple texts
   */
  embedBatch(texts: string[]): Promise<EmbeddingResponse[]>;

  /**
   * Count tokens in text
   */
  countTokens(text: string): Promise<number>;
}

/**
 * LLM Provider type
 */
export type LLMProviderType = 'anthropic' | 'openai' | 'google';

/**
 * LLM Error types
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public provider: LLMProviderType,
    public cause?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(provider: LLMProviderType, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider);
    this.name = 'LLMRateLimitError';
    this.retryAfter = retryAfter;
  }

  retryAfter?: number;
}

export class LLMAuthError extends LLMError {
  constructor(provider: LLMProviderType) {
    super(`Authentication failed for ${provider}`, provider);
    this.name = 'LLMAuthError';
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  LLMClient,
  ChatMessage,
  CompletionOptions,
  CompletionResponse,
  EmbeddingResponse,
} from './types';
import { LLMError, LLMRateLimitError, LLMAuthError } from './types';
import type { Logger } from 'pino';
import { createComponentLogger } from '../common/logger';

/**
 * Google Gemini Client
 */
export class GoogleClient implements LLMClient {
  private client: GoogleGenerativeAI;
  private logger: Logger;
  private model: string;
  private embeddingModel: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: {
    apiKey: string;
    model?: string;
    embeddingModel?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-1.5-pro';
    this.embeddingModel = config.embeddingModel || 'text-embedding-004';
    this.maxTokens = config.maxTokens || 4096;
    this.temperature = config.temperature || 0.7;
    this.logger = createComponentLogger('llm:google');

    this.logger.info({ model: this.model }, 'Google client initialized');
  }

  async complete(
    prompt: string,
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    try {
      this.logger.debug({ prompt: prompt.substring(0, 100) }, 'Generating completion');

      const model = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: options?.maxTokens || this.maxTokens,
          temperature: options?.temperature ?? this.temperature,
          stopSequences: options?.stopSequences,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;

      const content = response.text();
      const tokensUsed =
        (response.usageMetadata?.promptTokenCount || 0) +
        (response.usageMetadata?.candidatesTokenCount || 0);

      return {
        content,
        tokensUsed,
        model: this.model,
        finishReason: response.candidates?.[0]?.finishReason,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    try {
      this.logger.debug(
        { messageCount: messages.length },
        'Generating chat completion'
      );

      const model = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: options?.maxTokens || this.maxTokens,
          temperature: options?.temperature ?? this.temperature,
          stopSequences: options?.stopSequences,
        },
      });

      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
      }));

      const lastMessage = messages[messages.length - 1];
      const lastContent = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastContent);
      const response = result.response;

      const content = response.text();
      const tokensUsed =
        (response.usageMetadata?.promptTokenCount || 0) +
        (response.usageMetadata?.candidatesTokenCount || 0);

      return {
        content,
        tokensUsed,
        model: this.model,
        finishReason: response.candidates?.[0]?.finishReason,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async embed(text: string): Promise<EmbeddingResponse> {
    try {
      this.logger.debug('Generating embedding');

      const model = this.client.getGenerativeModel({
        model: this.embeddingModel,
      });

      const result = await model.embedContent(text);

      return {
        embedding: result.embedding.values,
        tokensUsed: 0, // Google doesn't report token usage for embeddings
        model: this.embeddingModel,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    try {
      this.logger.debug({ count: texts.length }, 'Generating batch embeddings');

      const model = this.client.getGenerativeModel({
        model: this.embeddingModel,
      });

      const requests = texts.map((text) => ({
        content: { role: 'user' as const, parts: [{ text }] },
      }));

      const result = await model.batchEmbedContents({
        requests,
      });

      return result.embeddings.map((emb) => ({
        embedding: emb.values,
        tokensUsed: 0,
        model: this.embeddingModel,
      }));
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async countTokens(text: string): Promise<number> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
      });

      const result = await model.countTokens(text);
      return result.totalTokens;
    } catch (error: any) {
      this.logger.warn({ error }, 'Failed to count tokens, using estimation');
      // Rough estimation
      return Math.ceil(text.length / 4);
    }
  }

  private handleError(error: any): never {
    this.logger.error({ error }, 'Google API error');

    const message = error.message || String(error);

    if (message.includes('quota') || message.includes('rate limit')) {
      throw new LLMRateLimitError('google');
    }

    if (message.includes('authentication') || message.includes('API key')) {
      throw new LLMAuthError('google');
    }

    throw new LLMError(`Google API error: ${message}`, 'google', error);
  }
}

import Anthropic from '@anthropic-ai/sdk';
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
 * Anthropic Claude Client
 */
export class AnthropicClient implements LLMClient {
  private client: Anthropic;
  private logger: Logger;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });

    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config.maxTokens || 4096;
    this.temperature = config.temperature || 0.7;
    this.logger = createComponentLogger('llm:anthropic');

    this.logger.info({ model: this.model }, 'Anthropic client initialized');
  }

  async complete(
    prompt: string,
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    try {
      this.logger.debug({ prompt: prompt.substring(0, 100) }, 'Generating completion');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || this.maxTokens,
        temperature: options?.temperature ?? this.temperature,
        messages: [{ role: 'user', content: prompt }],
        stop_sequences: options?.stopSequences,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new LLMError('Unexpected response type from Claude', 'anthropic');
      }

      const result: CompletionResponse = {
        content: content.text,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
        finishReason: response.stop_reason || undefined,
      };

      this.logger.debug(
        { tokensUsed: result.tokensUsed },
        'Completion generated'
      );

      return result;
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
        { messageCount: messages.length, toolsCount: options?.tools?.length },
        'Generating chat completion'
      );

      // Convert messages format
      const anthropicMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => {
          // Handle tool role for tool results
          if (m.role === 'tool') {
            return {
              role: 'user' as const,
              content: [
                {
                  type: 'tool_result' as const,
                  tool_use_id: m.tool_call_id!,
                  content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                },
              ],
            };
          }

          return {
            role: m.role as 'user' | 'assistant',
            content: m.content,
          };
        });

      // Extract system message if present
      const systemMessage = messages.find((m) => m.role === 'system');

      // Convert tools to Anthropic format
      const tools = options?.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      }));

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || this.maxTokens,
        temperature: options?.temperature ?? this.temperature,
        system: typeof systemMessage?.content === 'string' ? systemMessage.content : undefined,
        messages: anthropicMessages as any,
        stop_sequences: options?.stopSequences,
        tools: tools as any,
      });

      // Extract text content and tool calls
      let textContent = '';
      const toolCalls: any[] = [];

      for (const content of response.content) {
        if (content.type === 'text') {
          textContent += content.text;
        } else if (content.type === 'tool_use') {
          toolCalls.push({
            id: content.id,
            name: content.name,
            input: content.input,
          });
        }
      }

      const result: CompletionResponse = {
        content: textContent,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
        finishReason: response.stop_reason || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };

      this.logger.debug(
        { tokensUsed: result.tokensUsed, toolCallsCount: toolCalls.length },
        'Chat completion generated'
      );

      return result;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async embed(_text: string): Promise<EmbeddingResponse> {
    // Claude doesn't have native embedding API
    // This should use Voyage AI or similar
    throw new LLMError(
      'Anthropic does not provide embedding API. Use Google or OpenAI instead.',
      'anthropic'
    );
  }

  async embedBatch(_texts: string[]): Promise<EmbeddingResponse[]> {
    throw new LLMError(
      'Anthropic does not provide embedding API. Use Google or OpenAI instead.',
      'anthropic'
    );
  }

  async countTokens(text: string): Promise<number> {
    // Anthropic SDK v0.30 doesn't have countTokens method
    // Use rough estimation: 1 token ≈ 4 characters
    this.logger.debug('Using token estimation for Anthropic');
    return Math.ceil(text.length / 4);
  }

  private handleError(error: any): never {
    this.logger.error({ error }, 'Anthropic API error');

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'];
        throw new LLMRateLimitError(
          'anthropic',
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      if (error.status === 401 || error.status === 403) {
        throw new LLMAuthError('anthropic');
      }

      throw new LLMError(
        `Anthropic API error: ${error.message}`,
        'anthropic',
        error
      );
    }

    throw new LLMError('Unknown error from Anthropic', 'anthropic', error);
  }
}

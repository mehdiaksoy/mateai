import type { LLMClient, LLMProviderType } from './types';
import { AnthropicClient } from './anthropic-client';
import { GoogleClient } from './google-client';
import type { LLMConfig } from '../config';
import { createComponentLogger } from '../common/logger';

const logger = createComponentLogger('llm:factory');

/**
 * Create LLM client based on provider
 */
export function createLLMClient(
  provider: LLMProviderType,
  config: LLMConfig
): LLMClient {
  logger.info({ provider }, `Creating LLM client for ${provider}`);

  switch (provider) {
    case 'anthropic':
      return new AnthropicClient({
        apiKey: config.anthropic.apiKey,
        model: config.anthropic.model,
        maxTokens: config.anthropic.maxTokens,
        temperature: config.anthropic.temperature,
      });

    case 'google':
      if (!config.google.apiKey) {
        throw new Error('Google API key not configured');
      }
      return new GoogleClient({
        apiKey: config.google.apiKey,
        model: config.google.model,
        maxTokens: config.google.maxTokens,
        temperature: config.google.temperature,
      });

    case 'openai':
      // TODO: Implement OpenAI client
      throw new Error('OpenAI client not yet implemented');

    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * LLM Client Manager
 * Manages multiple LLM clients with fallback support
 */
export class LLMClientManager {
  private clients: Map<LLMProviderType, LLMClient> = new Map();
  private defaultProvider: LLMProviderType;

  constructor(config: LLMConfig) {
    this.defaultProvider = config.defaultProvider;

    // Initialize Anthropic (always required)
    this.clients.set('anthropic', createLLMClient('anthropic', config));

    // Initialize Google if configured
    if (config.google.apiKey) {
      try {
        this.clients.set('google', createLLMClient('google', config));
      } catch (error) {
        logger.warn({ error }, 'Failed to initialize Google client');
      }
    }

    // Initialize OpenAI if configured
    if (config.openai.apiKey) {
      try {
        // this.clients.set('openai', createLLMClient('openai', config));
        logger.info('OpenAI client not yet implemented, skipping');
      } catch (error) {
        logger.warn({ error }, 'Failed to initialize OpenAI client');
      }
    }

    logger.info(
      {
        providers: Array.from(this.clients.keys()),
        default: this.defaultProvider,
      },
      'LLM Client Manager initialized'
    );
  }

  /**
   * Get client for specific provider
   */
  getClient(provider?: LLMProviderType): LLMClient {
    const targetProvider = provider || this.defaultProvider;
    const client = this.clients.get(targetProvider);

    if (!client) {
      throw new Error(`LLM client not available for provider: ${targetProvider}`);
    }

    return client;
  }

  /**
   * Get client with fallback
   * Tries default provider, then falls back to any available provider
   */
  async getClientWithFallback(
    preferredProvider?: LLMProviderType
  ): Promise<LLMClient> {
    const providers = [
      preferredProvider || this.defaultProvider,
      ...Array.from(this.clients.keys()).filter(
        (p) => p !== (preferredProvider || this.defaultProvider)
      ),
    ];

    for (const provider of providers) {
      const client = this.clients.get(provider);
      if (client) {
        return client;
      }
    }

    throw new Error('No LLM clients available');
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): LLMProviderType[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if provider is available
   */
  hasProvider(provider: LLMProviderType): boolean {
    return this.clients.has(provider);
  }
}

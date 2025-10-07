/**
 * LLM Integration Module
 *
 * Provides unified interface for multiple LLM providers
 *
 * Usage:
 * ```typescript
 * import { LLMClientManager, createLLMClient } from '@mateai/core/llm';
 *
 * const manager = new LLMClientManager(config.llm);
 *
 * // Get default client
 * const client = manager.getClient();
 *
 * // Generate completion
 * const response = await client.complete('Hello, world!');
 *
 * // Generate embeddings
 * const googleClient = manager.getClient('google');
 * const embedding = await googleClient.embed('Some text to embed');
 * ```
 */

export * from './types';
export * from './anthropic-client';
export * from './google-client';
export * from './factory';

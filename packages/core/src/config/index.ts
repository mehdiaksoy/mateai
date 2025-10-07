/**
 * Configuration Management Module
 *
 * Provides type-safe, validated configuration loaded from environment variables.
 *
 * Usage:
 * ```typescript
 * import { getConfig } from '@mateai/core/config';
 *
 * const config = getConfig();
 * console.log(config.database.url);
 * console.log(config.llm.anthropic.apiKey);
 * ```
 */

export * from './schema';
export { getConfig, loadConfig, resetConfig } from './loader';

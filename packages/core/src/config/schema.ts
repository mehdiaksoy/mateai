import { z } from 'zod';

/**
 * Configuration Schema using Zod for validation
 * All environment variables are validated at startup
 */

// LLM Provider enum
export const LLMProviderSchema = z.enum(['anthropic', 'openai', 'google']);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

// Node environment enum
export const NodeEnvSchema = z.enum(['development', 'production', 'test']);
export type NodeEnv = z.infer<typeof NodeEnvSchema>;

// Log level enum
export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

/**
 * Database Configuration
 */
export const DatabaseConfigSchema = z.object({
  url: z.string().url().describe('PostgreSQL connection URL'),
  maxConnections: z.number().int().positive().default(10),
  connectionTimeout: z.number().int().positive().default(30000), // 30s
});
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

/**
 * Redis Configuration
 */
export const RedisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().int().positive().default(6379),
  password: z.string().optional(),
  db: z.number().int().min(0).default(0),
  maxRetriesPerRequest: z.number().int().positive().nullable().default(null), // null for BullMQ
});
export type RedisConfig = z.infer<typeof RedisConfigSchema>;

/**
 * LLM Provider Configuration
 */
export const LLMConfigSchema = z.object({
  // Default provider
  defaultProvider: LLMProviderSchema.default('anthropic'),

  // Anthropic (Claude)
  anthropic: z.object({
    apiKey: z.string().min(1, 'Anthropic API key is required'),
    model: z.string().default('claude-3-5-sonnet-20241022'),
    maxTokens: z.number().int().positive().default(4096),
    temperature: z.number().min(0).max(1).default(0.7),
  }),

  // OpenAI
  openai: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('gpt-4-turbo-preview'),
    maxTokens: z.number().int().positive().default(4096),
    temperature: z.number().min(0).max(2).default(0.7),
  }),

  // Google (Gemini)
  google: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('gemini-1.5-pro'),
    maxTokens: z.number().int().positive().default(4096),
    temperature: z.number().min(0).max(2).default(0.7),
  }),
});
export type LLMConfig = z.infer<typeof LLMConfigSchema>;

/**
 * Embedding Configuration
 */
export const EmbeddingConfigSchema = z.object({
  provider: LLMProviderSchema.default('google'),
  model: z.string().default('text-embedding-004'),
  dimensions: z.number().int().positive().default(768),
  batchSize: z.number().int().positive().default(100), // Process embeddings in batches
});
export type EmbeddingConfig = z.infer<typeof EmbeddingConfigSchema>;

/**
 * Application Configuration
 */
export const AppConfigSchema = z.object({
  nodeEnv: NodeEnvSchema.default('development'),
  port: z.number().int().positive().default(3000),
  logLevel: LogLevelSchema.default('info'),
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * API Configuration
 */
export const ApiConfigSchema = z.object({
  port: z.number().int().positive().default(3000),
  corsOrigins: z.string().default('*'),
  rateLimit: z.object({
    windowMs: z.number().int().positive().default(15 * 60 * 1000), // 15 minutes
    max: z.number().int().positive().default(100), // 100 requests per window
  }).optional(),
});
export type ApiConfig = z.infer<typeof ApiConfigSchema>;

/**
 * Slack Configuration (optional)
 */
export const SlackConfigSchema = z
  .object({
    botToken: z.string().optional(),
    appToken: z.string().optional(),
    signingSecret: z.string().optional(),
    enabled: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // If enabled, all fields are required
      if (data.enabled) {
        return !!data.botToken && !!data.appToken && !!data.signingSecret;
      }
      return true;
    },
    {
      message: 'Slack tokens are required when Slack is enabled',
    }
  );
export type SlackConfig = z.infer<typeof SlackConfigSchema>;

/**
 * Jira Configuration (optional)
 */
export const JiraConfigSchema = z
  .object({
    host: z.string().url().optional(),
    email: z.string().email().optional(),
    apiToken: z.string().optional(),
    enabled: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.enabled) {
        return !!data.host && !!data.email && !!data.apiToken;
      }
      return true;
    },
    {
      message: 'Jira credentials are required when Jira is enabled',
    }
  );
export type JiraConfig = z.infer<typeof JiraConfigSchema>;

/**
 * GitHub Configuration (optional)
 */
export const GitHubConfigSchema = z
  .object({
    token: z.string().optional(),
    webhookSecret: z.string().optional(),
    enabled: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.enabled) {
        return !!data.token && !!data.webhookSecret;
      }
      return true;
    },
    {
      message: 'GitHub token and webhook secret are required when GitHub is enabled',
    }
  );
export type GitHubConfig = z.infer<typeof GitHubConfigSchema>;

/**
 * Complete Configuration Schema
 */
export const ConfigSchema = z.object({
  app: AppConfigSchema,
  api: ApiConfigSchema.optional(),
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  llm: LLMConfigSchema,
  embedding: EmbeddingConfigSchema,
  slack: SlackConfigSchema,
  jira: JiraConfigSchema,
  github: GitHubConfigSchema,
});

export type Config = z.infer<typeof ConfigSchema>;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigSchema = exports.GitHubConfigSchema = exports.JiraConfigSchema = exports.SlackConfigSchema = exports.ApiConfigSchema = exports.AppConfigSchema = exports.EmbeddingConfigSchema = exports.LLMConfigSchema = exports.RedisConfigSchema = exports.DatabaseConfigSchema = exports.LogLevelSchema = exports.NodeEnvSchema = exports.LLMProviderSchema = void 0;
const zod_1 = require("zod");
exports.LLMProviderSchema = zod_1.z.enum(['anthropic', 'openai', 'google']);
exports.NodeEnvSchema = zod_1.z.enum(['development', 'production', 'test']);
exports.LogLevelSchema = zod_1.z.enum(['debug', 'info', 'warn', 'error']);
exports.DatabaseConfigSchema = zod_1.z.object({
    url: zod_1.z.string().url().describe('PostgreSQL connection URL'),
    maxConnections: zod_1.z.number().int().positive().default(10),
    connectionTimeout: zod_1.z.number().int().positive().default(30000),
});
exports.RedisConfigSchema = zod_1.z.object({
    host: zod_1.z.string().default('localhost'),
    port: zod_1.z.number().int().positive().default(6379),
    password: zod_1.z.string().optional(),
    db: zod_1.z.number().int().min(0).default(0),
    maxRetriesPerRequest: zod_1.z.number().int().positive().nullable().default(null),
});
exports.LLMConfigSchema = zod_1.z.object({
    defaultProvider: exports.LLMProviderSchema.default('anthropic'),
    anthropic: zod_1.z.object({
        apiKey: zod_1.z.string().min(1, 'Anthropic API key is required'),
        model: zod_1.z.string().default('claude-3-5-sonnet-20241022'),
        maxTokens: zod_1.z.number().int().positive().default(4096),
        temperature: zod_1.z.number().min(0).max(1).default(0.7),
    }),
    openai: zod_1.z.object({
        apiKey: zod_1.z.string().optional(),
        model: zod_1.z.string().default('gpt-4-turbo-preview'),
        maxTokens: zod_1.z.number().int().positive().default(4096),
        temperature: zod_1.z.number().min(0).max(2).default(0.7),
    }),
    google: zod_1.z.object({
        apiKey: zod_1.z.string().optional(),
        model: zod_1.z.string().default('gemini-1.5-pro'),
        maxTokens: zod_1.z.number().int().positive().default(4096),
        temperature: zod_1.z.number().min(0).max(2).default(0.7),
    }),
});
exports.EmbeddingConfigSchema = zod_1.z.object({
    provider: exports.LLMProviderSchema.default('google'),
    model: zod_1.z.string().default('text-embedding-004'),
    dimensions: zod_1.z.number().int().positive().default(768),
    batchSize: zod_1.z.number().int().positive().default(100),
});
exports.AppConfigSchema = zod_1.z.object({
    nodeEnv: exports.NodeEnvSchema.default('development'),
    port: zod_1.z.number().int().positive().default(3000),
    logLevel: exports.LogLevelSchema.default('info'),
});
exports.ApiConfigSchema = zod_1.z.object({
    port: zod_1.z.number().int().positive().default(3000),
    corsOrigins: zod_1.z.string().default('*'),
    rateLimit: zod_1.z.object({
        windowMs: zod_1.z.number().int().positive().default(15 * 60 * 1000),
        max: zod_1.z.number().int().positive().default(100),
    }).optional(),
});
exports.SlackConfigSchema = zod_1.z
    .object({
    botToken: zod_1.z.string().optional(),
    appToken: zod_1.z.string().optional(),
    signingSecret: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(false),
})
    .refine((data) => {
    if (data.enabled) {
        return !!data.botToken && !!data.appToken && !!data.signingSecret;
    }
    return true;
}, {
    message: 'Slack tokens are required when Slack is enabled',
});
exports.JiraConfigSchema = zod_1.z
    .object({
    host: zod_1.z.string().url().optional(),
    email: zod_1.z.string().email().optional(),
    apiToken: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(false),
})
    .refine((data) => {
    if (data.enabled) {
        return !!data.host && !!data.email && !!data.apiToken;
    }
    return true;
}, {
    message: 'Jira credentials are required when Jira is enabled',
});
exports.GitHubConfigSchema = zod_1.z
    .object({
    token: zod_1.z.string().optional(),
    webhookSecret: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(false),
})
    .refine((data) => {
    if (data.enabled) {
        return !!data.token && !!data.webhookSecret;
    }
    return true;
}, {
    message: 'GitHub token and webhook secret are required when GitHub is enabled',
});
exports.ConfigSchema = zod_1.z.object({
    app: exports.AppConfigSchema,
    api: exports.ApiConfigSchema.optional(),
    database: exports.DatabaseConfigSchema,
    redis: exports.RedisConfigSchema,
    llm: exports.LLMConfigSchema,
    embedding: exports.EmbeddingConfigSchema,
    slack: exports.SlackConfigSchema,
    jira: exports.JiraConfigSchema,
    github: exports.GitHubConfigSchema,
});
//# sourceMappingURL=schema.js.map
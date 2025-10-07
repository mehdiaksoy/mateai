"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.getConfig = getConfig;
exports.resetConfig = resetConfig;
const schema_1 = require("./schema");
function loadConfig() {
    const rawConfig = {
        app: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: parseInt(process.env.PORT || '3000', 10),
            logLevel: process.env.LOG_LEVEL || 'info',
        },
        database: {
            url: process.env.DATABASE_URL,
            maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
            connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000', 10),
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0', 10),
            maxRetriesPerRequest: null,
        },
        llm: {
            defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'anthropic',
            anthropic: {
                apiKey: process.env.ANTHROPIC_API_KEY || '',
                model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
                maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10),
                temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
            },
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
                temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
            },
            google: {
                apiKey: process.env.GOOGLE_API_KEY,
                model: process.env.GOOGLE_MODEL || 'gemini-1.5-pro',
                maxTokens: parseInt(process.env.GOOGLE_MAX_TOKENS || '4096', 10),
                temperature: parseFloat(process.env.GOOGLE_TEMPERATURE || '0.7'),
            },
        },
        embedding: {
            provider: process.env.EMBEDDING_PROVIDER || 'google',
            model: process.env.EMBEDDING_MODEL || 'text-embedding-004',
            dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '768', 10),
            batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '100', 10),
        },
        slack: {
            botToken: process.env.SLACK_BOT_TOKEN,
            appToken: process.env.SLACK_APP_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            enabled: !!process.env.SLACK_BOT_TOKEN &&
                !!process.env.SLACK_APP_TOKEN &&
                !!process.env.SLACK_SIGNING_SECRET,
        },
        jira: {
            host: process.env.JIRA_HOST,
            email: process.env.JIRA_EMAIL,
            apiToken: process.env.JIRA_API_TOKEN,
            enabled: !!process.env.JIRA_HOST &&
                !!process.env.JIRA_EMAIL &&
                !!process.env.JIRA_API_TOKEN,
        },
        github: {
            token: process.env.GITHUB_TOKEN,
            webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
            enabled: !!process.env.GITHUB_TOKEN && !!process.env.GITHUB_WEBHOOK_SECRET,
        },
    };
    const result = schema_1.ConfigSchema.safeParse(rawConfig);
    if (!result.success) {
        console.error('❌ Configuration validation failed:');
        console.error(JSON.stringify(result.error.format(), null, 2));
        throw new Error('Invalid configuration. Check environment variables.');
    }
    return result.data;
}
let configInstance = null;
function getConfig() {
    if (!configInstance) {
        configInstance = loadConfig();
    }
    return configInstance;
}
function resetConfig() {
    configInstance = null;
}
//# sourceMappingURL=loader.js.map
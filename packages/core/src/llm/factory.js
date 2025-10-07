"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClientManager = void 0;
exports.createLLMClient = createLLMClient;
const anthropic_client_1 = require("./anthropic-client");
const google_client_1 = require("./google-client");
const logger_1 = require("../common/logger");
const logger = (0, logger_1.createComponentLogger)('llm:factory');
function createLLMClient(provider, config) {
    logger.info({ provider }, `Creating LLM client for ${provider}`);
    switch (provider) {
        case 'anthropic':
            return new anthropic_client_1.AnthropicClient({
                apiKey: config.anthropic.apiKey,
                model: config.anthropic.model,
                maxTokens: config.anthropic.maxTokens,
                temperature: config.anthropic.temperature,
            });
        case 'google':
            if (!config.google.apiKey) {
                throw new Error('Google API key not configured');
            }
            return new google_client_1.GoogleClient({
                apiKey: config.google.apiKey,
                model: config.google.model,
                maxTokens: config.google.maxTokens,
                temperature: config.google.temperature,
            });
        case 'openai':
            throw new Error('OpenAI client not yet implemented');
        default:
            throw new Error(`Unknown LLM provider: ${provider}`);
    }
}
class LLMClientManager {
    clients = new Map();
    defaultProvider;
    constructor(config) {
        this.defaultProvider = config.defaultProvider;
        this.clients.set('anthropic', createLLMClient('anthropic', config));
        if (config.google.apiKey) {
            try {
                this.clients.set('google', createLLMClient('google', config));
            }
            catch (error) {
                logger.warn({ error }, 'Failed to initialize Google client');
            }
        }
        if (config.openai.apiKey) {
            try {
                logger.info('OpenAI client not yet implemented, skipping');
            }
            catch (error) {
                logger.warn({ error }, 'Failed to initialize OpenAI client');
            }
        }
        logger.info({
            providers: Array.from(this.clients.keys()),
            default: this.defaultProvider,
        }, 'LLM Client Manager initialized');
    }
    getClient(provider) {
        const targetProvider = provider || this.defaultProvider;
        const client = this.clients.get(targetProvider);
        if (!client) {
            throw new Error(`LLM client not available for provider: ${targetProvider}`);
        }
        return client;
    }
    async getClientWithFallback(preferredProvider) {
        const providers = [
            preferredProvider || this.defaultProvider,
            ...Array.from(this.clients.keys()).filter((p) => p !== (preferredProvider || this.defaultProvider)),
        ];
        for (const provider of providers) {
            const client = this.clients.get(provider);
            if (client) {
                return client;
            }
        }
        throw new Error('No LLM clients available');
    }
    getAvailableProviders() {
        return Array.from(this.clients.keys());
    }
    hasProvider(provider) {
        return this.clients.has(provider);
    }
}
exports.LLMClientManager = LLMClientManager;
//# sourceMappingURL=factory.js.map
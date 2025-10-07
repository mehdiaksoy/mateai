"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleClient = void 0;
const generative_ai_1 = require("@google/generative-ai");
const types_1 = require("./types");
const logger_1 = require("../common/logger");
class GoogleClient {
    client;
    logger;
    model;
    embeddingModel;
    maxTokens;
    temperature;
    constructor(config) {
        this.client = new generative_ai_1.GoogleGenerativeAI(config.apiKey);
        this.model = config.model || 'gemini-1.5-pro';
        this.embeddingModel = config.embeddingModel || 'text-embedding-004';
        this.maxTokens = config.maxTokens || 4096;
        this.temperature = config.temperature || 0.7;
        this.logger = (0, logger_1.createComponentLogger)('llm:google');
        this.logger.info({ model: this.model }, 'Google client initialized');
    }
    async complete(prompt, options) {
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
            const tokensUsed = (response.usageMetadata?.promptTokenCount || 0) +
                (response.usageMetadata?.candidatesTokenCount || 0);
            return {
                content,
                tokensUsed,
                model: this.model,
                finishReason: response.candidates?.[0]?.finishReason,
            };
        }
        catch (error) {
            return this.handleError(error);
        }
    }
    async chat(messages, options) {
        try {
            this.logger.debug({ messageCount: messages.length }, 'Generating chat completion');
            const model = this.client.getGenerativeModel({
                model: this.model,
                generationConfig: {
                    maxOutputTokens: options?.maxTokens || this.maxTokens,
                    temperature: options?.temperature ?? this.temperature,
                    stopSequences: options?.stopSequences,
                },
            });
            const history = messages.slice(0, -1).map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
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
            const tokensUsed = (response.usageMetadata?.promptTokenCount || 0) +
                (response.usageMetadata?.candidatesTokenCount || 0);
            return {
                content,
                tokensUsed,
                model: this.model,
                finishReason: response.candidates?.[0]?.finishReason,
            };
        }
        catch (error) {
            return this.handleError(error);
        }
    }
    async embed(text) {
        try {
            this.logger.debug('Generating embedding');
            const model = this.client.getGenerativeModel({
                model: this.embeddingModel,
            });
            const result = await model.embedContent(text);
            return {
                embedding: result.embedding.values,
                tokensUsed: 0,
                model: this.embeddingModel,
            };
        }
        catch (error) {
            return this.handleError(error);
        }
    }
    async embedBatch(texts) {
        try {
            this.logger.debug({ count: texts.length }, 'Generating batch embeddings');
            const model = this.client.getGenerativeModel({
                model: this.embeddingModel,
            });
            const requests = texts.map((text) => ({
                content: { role: 'user', parts: [{ text }] },
            }));
            const result = await model.batchEmbedContents({
                requests,
            });
            return result.embeddings.map((emb) => ({
                embedding: emb.values,
                tokensUsed: 0,
                model: this.embeddingModel,
            }));
        }
        catch (error) {
            return this.handleError(error);
        }
    }
    async countTokens(text) {
        try {
            const model = this.client.getGenerativeModel({
                model: this.model,
            });
            const result = await model.countTokens(text);
            return result.totalTokens;
        }
        catch (error) {
            this.logger.warn({ error }, 'Failed to count tokens, using estimation');
            return Math.ceil(text.length / 4);
        }
    }
    handleError(error) {
        this.logger.error({ error }, 'Google API error');
        const message = error.message || String(error);
        if (message.includes('quota') || message.includes('rate limit')) {
            throw new types_1.LLMRateLimitError('google');
        }
        if (message.includes('authentication') || message.includes('API key')) {
            throw new types_1.LLMAuthError('google');
        }
        throw new types_1.LLMError(`Google API error: ${message}`, 'google', error);
    }
}
exports.GoogleClient = GoogleClient;
//# sourceMappingURL=google-client.js.map
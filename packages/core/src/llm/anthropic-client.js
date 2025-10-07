"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicClient = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const types_1 = require("./types");
const logger_1 = require("../common/logger");
class AnthropicClient {
    client;
    logger;
    model;
    maxTokens;
    temperature;
    constructor(config) {
        this.client = new sdk_1.default({
            apiKey: config.apiKey,
        });
        this.model = config.model || 'claude-3-5-sonnet-20241022';
        this.maxTokens = config.maxTokens || 4096;
        this.temperature = config.temperature || 0.7;
        this.logger = (0, logger_1.createComponentLogger)('llm:anthropic');
        this.logger.info({ model: this.model }, 'Anthropic client initialized');
    }
    async complete(prompt, options) {
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
                throw new types_1.LLMError('Unexpected response type from Claude', 'anthropic');
            }
            const result = {
                content: content.text,
                tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
                model: response.model,
                finishReason: response.stop_reason || undefined,
            };
            this.logger.debug({ tokensUsed: result.tokensUsed }, 'Completion generated');
            return result;
        }
        catch (error) {
            return this.handleError(error);
        }
    }
    async chat(messages, options) {
        try {
            this.logger.debug({ messageCount: messages.length, toolsCount: options?.tools?.length }, 'Generating chat completion');
            const anthropicMessages = messages
                .filter((m) => m.role !== 'system')
                .map((m) => {
                if (m.role === 'tool') {
                    return {
                        role: 'user',
                        content: [
                            {
                                type: 'tool_result',
                                tool_use_id: m.tool_call_id,
                                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                            },
                        ],
                    };
                }
                return {
                    role: m.role,
                    content: m.content,
                };
            });
            const systemMessage = messages.find((m) => m.role === 'system');
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
                messages: anthropicMessages,
                stop_sequences: options?.stopSequences,
                tools: tools,
            });
            let textContent = '';
            const toolCalls = [];
            for (const content of response.content) {
                if (content.type === 'text') {
                    textContent += content.text;
                }
                else if (content.type === 'tool_use') {
                    toolCalls.push({
                        id: content.id,
                        name: content.name,
                        input: content.input,
                    });
                }
            }
            const result = {
                content: textContent,
                tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
                model: response.model,
                finishReason: response.stop_reason || undefined,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            };
            this.logger.debug({ tokensUsed: result.tokensUsed, toolCallsCount: toolCalls.length }, 'Chat completion generated');
            return result;
        }
        catch (error) {
            return this.handleError(error);
        }
    }
    async embed(_text) {
        throw new types_1.LLMError('Anthropic does not provide embedding API. Use Google or OpenAI instead.', 'anthropic');
    }
    async embedBatch(_texts) {
        throw new types_1.LLMError('Anthropic does not provide embedding API. Use Google or OpenAI instead.', 'anthropic');
    }
    async countTokens(text) {
        this.logger.debug('Using token estimation for Anthropic');
        return Math.ceil(text.length / 4);
    }
    handleError(error) {
        this.logger.error({ error }, 'Anthropic API error');
        if (error instanceof sdk_1.default.APIError) {
            if (error.status === 429) {
                const retryAfter = error.headers?.['retry-after'];
                throw new types_1.LLMRateLimitError('anthropic', retryAfter ? parseInt(retryAfter, 10) : undefined);
            }
            if (error.status === 401 || error.status === 403) {
                throw new types_1.LLMAuthError('anthropic');
            }
            throw new types_1.LLMError(`Anthropic API error: ${error.message}`, 'anthropic', error);
        }
        throw new types_1.LLMError('Unknown error from Anthropic', 'anthropic', error);
    }
}
exports.AnthropicClient = AnthropicClient;
//# sourceMappingURL=anthropic-client.js.map
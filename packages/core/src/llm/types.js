"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAuthError = exports.LLMRateLimitError = exports.LLMError = void 0;
class LLMError extends Error {
    provider;
    cause;
    constructor(message, provider, cause) {
        super(message);
        this.provider = provider;
        this.cause = cause;
        this.name = 'LLMError';
    }
}
exports.LLMError = LLMError;
class LLMRateLimitError extends LLMError {
    constructor(provider, retryAfter) {
        super(`Rate limit exceeded for ${provider}`, provider);
        this.name = 'LLMRateLimitError';
        this.retryAfter = retryAfter;
    }
    retryAfter;
}
exports.LLMRateLimitError = LLMRateLimitError;
class LLMAuthError extends LLMError {
    constructor(provider) {
        super(`Authentication failed for ${provider}`, provider);
        this.name = 'LLMAuthError';
    }
}
exports.LLMAuthError = LLMAuthError;
//# sourceMappingURL=types.js.map
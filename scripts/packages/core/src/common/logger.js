"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevels = void 0;
exports.createLogger = createLogger;
exports.getLogger = getLogger;
exports.createChildLogger = createChildLogger;
exports.createRequestLogger = createRequestLogger;
exports.createComponentLogger = createComponentLogger;
exports.logError = logError;
exports.logPerformance = logPerformance;
exports.measureTime = measureTime;
const pino_1 = __importDefault(require("pino"));
/**
 * Create a logger instance
 */
function createLogger(options = {}) {
    const { level = process.env.LOG_LEVEL || 'info', name = 'mateai', pretty = process.env.NODE_ENV === 'development', } = options;
    return (0, pino_1.default)({
        name,
        level,
        // Pretty print in development
        transport: pretty
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            }
            : undefined,
        // Base fields
        base: {
            env: process.env.NODE_ENV || 'development',
        },
        // Timestamp
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
        // Serializers for common objects
        serializers: {
            err: pino_1.default.stdSerializers.err,
            error: pino_1.default.stdSerializers.err,
            req: pino_1.default.stdSerializers.req,
            res: pino_1.default.stdSerializers.res,
        },
    });
}
/**
 * Default logger instance
 */
let defaultLogger = null;
/**
 * Get default logger
 */
function getLogger() {
    if (!defaultLogger) {
        defaultLogger = createLogger();
    }
    return defaultLogger;
}
/**
 * Create a child logger with additional context
 */
function createChildLogger(context) {
    return getLogger().child(context);
}
/**
 * Request correlation ID support
 */
function createRequestLogger(requestId) {
    return createChildLogger({ requestId });
}
/**
 * Component-specific logger
 */
function createComponentLogger(component) {
    return createChildLogger({ component });
}
/**
 * Log levels helper
 */
exports.LogLevels = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
};
/**
 * Utility: Log error with stack trace
 */
function logError(logger, error, context) {
    logger.error({
        err: error,
        ...context,
    }, error.message);
}
/**
 * Utility: Log performance metric
 */
function logPerformance(logger, operation, durationMs, context) {
    logger.info({
        operation,
        durationMs,
        ...context,
    }, `${operation} completed in ${durationMs}ms`);
}
/**
 * Utility: Measure execution time
 */
async function measureTime(operation, fn, logger) {
    const start = Date.now();
    try {
        const result = await fn();
        const duration = Date.now() - start;
        if (logger) {
            logPerformance(logger, operation, duration);
        }
        return result;
    }
    catch (error) {
        const duration = Date.now() - start;
        if (logger) {
            logError(logger, error, { operation, durationMs: duration });
        }
        throw error;
    }
}

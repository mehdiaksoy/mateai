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
function createLogger(options = {}) {
    const { level = process.env.LOG_LEVEL || 'info', name = 'mateai', pretty = process.env.NODE_ENV === 'development', } = options;
    return (0, pino_1.default)({
        name,
        level,
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
        base: {
            env: process.env.NODE_ENV || 'development',
        },
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
        serializers: {
            err: pino_1.default.stdSerializers.err,
            error: pino_1.default.stdSerializers.err,
            req: pino_1.default.stdSerializers.req,
            res: pino_1.default.stdSerializers.res,
        },
    });
}
let defaultLogger = null;
function getLogger() {
    if (!defaultLogger) {
        defaultLogger = createLogger();
    }
    return defaultLogger;
}
function createChildLogger(context) {
    return getLogger().child(context);
}
function createRequestLogger(requestId) {
    return createChildLogger({ requestId });
}
function createComponentLogger(component) {
    return createChildLogger({ component });
}
exports.LogLevels = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
};
function logError(logger, error, context) {
    logger.error({
        err: error,
        ...context,
    }, error.message);
}
function logPerformance(logger, operation, durationMs, context) {
    logger.info({
        operation,
        durationMs,
        ...context,
    }, `${operation} completed in ${durationMs}ms`);
}
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
//# sourceMappingURL=logger.js.map
import pino, { type Logger } from 'pino';
import type { LogLevel } from '../config';

/**
 * Logger Module
 *
 * Provides structured logging using Pino
 */

interface LoggerOptions {
  level?: LogLevel;
  name?: string;
  pretty?: boolean;
}

/**
 * Create a logger instance
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const {
    level = (process.env.LOG_LEVEL as LogLevel) || 'info',
    name = 'mateai',
    pretty = process.env.NODE_ENV === 'development',
  } = options;

  return pino({
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
    timestamp: pino.stdTimeFunctions.isoTime,
    // Serializers for common objects
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  });
}

/**
 * Default logger instance
 */
let defaultLogger: Logger | null = null;

/**
 * Get default logger
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = createLogger();
  }
  return defaultLogger;
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(
  context: Record<string, unknown>
): Logger {
  return getLogger().child(context);
}

/**
 * Request correlation ID support
 */
export function createRequestLogger(requestId: string): Logger {
  return createChildLogger({ requestId });
}

/**
 * Component-specific logger
 */
export function createComponentLogger(component: string): Logger {
  return createChildLogger({ component });
}

/**
 * Log levels helper
 */
export const LogLevels = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

/**
 * Utility: Log error with stack trace
 */
export function logError(logger: Logger, error: Error, context?: object): void {
  logger.error(
    {
      err: error,
      ...context,
    },
    error.message
  );
}

/**
 * Utility: Log performance metric
 */
export function logPerformance(
  logger: Logger,
  operation: string,
  durationMs: number,
  context?: object
): void {
  logger.info(
    {
      operation,
      durationMs,
      ...context,
    },
    `${operation} completed in ${durationMs}ms`
  );
}

/**
 * Utility: Measure execution time
 */
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  logger?: Logger
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    if (logger) {
      logPerformance(logger, operation, duration);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    if (logger) {
      logError(logger, error as Error, { operation, durationMs: duration });
    }
    throw error;
  }
}

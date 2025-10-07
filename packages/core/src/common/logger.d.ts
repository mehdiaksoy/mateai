import { type Logger } from 'pino';
import type { LogLevel } from '../config';
interface LoggerOptions {
    level?: LogLevel;
    name?: string;
    pretty?: boolean;
}
export declare function createLogger(options?: LoggerOptions): Logger;
export declare function getLogger(): Logger;
export declare function createChildLogger(context: Record<string, unknown>): Logger;
export declare function createRequestLogger(requestId: string): Logger;
export declare function createComponentLogger(component: string): Logger;
export declare const LogLevels: {
    readonly DEBUG: "debug";
    readonly INFO: "info";
    readonly WARN: "warn";
    readonly ERROR: "error";
};
export declare function logError(logger: Logger, error: Error, context?: object): void;
export declare function logPerformance(logger: Logger, operation: string, durationMs: number, context?: object): void;
export declare function measureTime<T>(operation: string, fn: () => Promise<T>, logger?: Logger): Promise<T>;
export {};
//# sourceMappingURL=logger.d.ts.map
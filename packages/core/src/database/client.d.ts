import { PrismaClient } from '@prisma/client';
import type { Config } from '../config';
export declare function getPrismaClient(config?: Config): PrismaClient;
export declare function disconnectDatabase(): Promise<void>;
export declare function isDatabaseHealthy(): Promise<boolean>;
export declare function executeRawQuery<T = unknown>(query: string, ...params: unknown[]): Promise<T>;
export declare function setupDatabaseShutdownHandlers(): void;
//# sourceMappingURL=client.d.ts.map
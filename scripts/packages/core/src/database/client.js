"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaClient = getPrismaClient;
exports.disconnectDatabase = disconnectDatabase;
exports.isDatabaseHealthy = isDatabaseHealthy;
exports.executeRawQuery = executeRawQuery;
exports.setupDatabaseShutdownHandlers = setupDatabaseShutdownHandlers;
const client_1 = require("@prisma/client");
/**
 * Database Client Manager
 *
 * Manages Prisma Client lifecycle with proper connection pooling
 * and graceful shutdown.
 */
let prismaInstance = null;
/**
 * Get Prisma Client instance (singleton)
 */
function getPrismaClient(config) {
    if (!prismaInstance) {
        prismaInstance = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: config?.database.url || process.env.DATABASE_URL,
                },
            },
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
        });
        // Handle connection errors
        prismaInstance.$connect().catch((err) => {
            console.error('Failed to connect to database:', err);
            process.exit(1);
        });
    }
    return prismaInstance;
}
/**
 * Disconnect from database
 */
async function disconnectDatabase() {
    if (prismaInstance) {
        await prismaInstance.$disconnect();
        prismaInstance = null;
    }
}
/**
 * Health check for database connection
 */
async function isDatabaseHealthy() {
    try {
        const client = getPrismaClient();
        await client.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}
/**
 * Execute raw SQL query (useful for pgvector operations)
 */
async function executeRawQuery(query, ...params) {
    const client = getPrismaClient();
    return client.$queryRawUnsafe(query, ...params);
}
/**
 * Setup graceful shutdown handlers
 */
function setupDatabaseShutdownHandlers() {
    const shutdown = async (signal) => {
        console.log(`Received ${signal}, closing database connections...`);
        await disconnectDatabase();
        process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

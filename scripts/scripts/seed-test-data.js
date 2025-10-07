"use strict";
/**
 * Seed Test Data
 *
 * Adds 20 sample Slack messages to the database for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../packages/core/src/database");
const logger_1 = require("../packages/core/src/common/logger");
const logger = (0, logger_1.getLogger)();
const prisma = (0, database_1.getPrismaClient)();
// Sample Slack messages about different topics
const sampleMessages = [
    {
        content: "Hey team! We're launching the new TypeScript migration next week. Make sure all your PRs are using strict mode.",
        summary: "TypeScript migration announcement - strict mode required for all PRs",
        author: "sarah@company.com",
        channel: "#engineering",
        importance: 0.8,
    },
    {
        content: "The API gateway is experiencing high latency. Looking into it now. ETA 30 minutes for fix.",
        summary: "API gateway performance issue - investigating, ETA 30 min",
        author: "devops@company.com",
        channel: "#incidents",
        importance: 0.9,
    },
    {
        content: "Can someone review my PR for the authentication refactor? https://github.com/company/repo/pull/234",
        summary: "PR review request for authentication refactor",
        author: "mike@company.com",
        channel: "#code-review",
        importance: 0.6,
    },
    {
        content: "Reminder: Sprint planning meeting tomorrow at 10 AM. Please update your story points before the meeting.",
        summary: "Sprint planning reminder - update story points",
        author: "pm@company.com",
        channel: "#team-updates",
        importance: 0.7,
    },
    {
        content: "Just deployed v2.3.0 to production. All tests passed. Monitoring metrics now.",
        summary: "Production deployment v2.3.0 completed successfully",
        author: "deployment-bot@company.com",
        channel: "#deployments",
        importance: 0.8,
    },
    {
        content: "PSA: The Redis cache will be down for maintenance tonight from 2-3 AM EST. Plan accordingly.",
        summary: "Redis maintenance window tonight 2-3 AM EST",
        author: "sre@company.com",
        channel: "#engineering",
        importance: 0.85,
    },
    {
        content: "Great job on the demo today team! The client loved the new dashboard features.",
        summary: "Positive client feedback on dashboard demo",
        author: "sales@company.com",
        channel: "#wins",
        importance: 0.5,
    },
    {
        content: "Bug found in payment processing for international transactions. Creating hotfix branch now.",
        summary: "Critical payment bug - international transactions, hotfix in progress",
        author: "backend-lead@company.com",
        channel: "#incidents",
        importance: 0.95,
    },
    {
        content: "Updated our documentation for the new API endpoints. Check it out: https://docs.company.com/api",
        summary: "API documentation updated with new endpoints",
        author: "docs-team@company.com",
        channel: "#engineering",
        importance: 0.6,
    },
    {
        content: "Anyone know why the CI pipeline is failing on the frontend tests? Getting timeout errors.",
        summary: "CI pipeline issue - frontend tests timing out",
        author: "john@company.com",
        channel: "#help",
        importance: 0.7,
    },
    {
        content: "Database migration for user_profiles table completed successfully. All indexes rebuilt.",
        summary: "Successful database migration for user_profiles table",
        author: "dba@company.com",
        channel: "#database",
        importance: 0.75,
    },
    {
        content: "Security update: Please enable 2FA on your GitHub accounts by end of week. Instructions in #security-updates",
        summary: "Mandatory 2FA enablement for GitHub accounts - deadline EOW",
        author: "security@company.com",
        channel: "#announcements",
        importance: 0.9,
    },
    {
        content: "The new monitoring dashboard is live! You can now see real-time metrics at https://monitor.company.com",
        summary: "New real-time monitoring dashboard launched",
        author: "platform@company.com",
        channel: "#engineering",
        importance: 0.7,
    },
    {
        content: "Code freeze starts Friday for the release. No new features after that, only critical bugs.",
        summary: "Code freeze Friday - critical bugs only after that",
        author: "release-manager@company.com",
        channel: "#engineering",
        importance: 0.85,
    },
    {
        content: "I've updated the onboarding docs with the latest setup instructions. New devs should start here: https://wiki.company.com/onboarding",
        summary: "Onboarding documentation updated with latest setup",
        author: "tech-lead@company.com",
        channel: "#team-updates",
        importance: 0.6,
    },
    {
        content: "Load testing results are in. System handles 10K concurrent users smoothly. Bottleneck is in the recommendation engine.",
        summary: "Load testing completed - 10K users OK, bottleneck in recommendation engine",
        author: "performance-team@company.com",
        channel: "#engineering",
        importance: 0.75,
    },
    {
        content: "Question: What's our strategy for handling API rate limiting? Should we implement exponential backoff?",
        summary: "Discussion about API rate limiting strategy and exponential backoff",
        author: "junior-dev@company.com",
        channel: "#architecture",
        importance: 0.65,
    },
    {
        content: "All hands meeting moved to Thursday 3 PM. Video link will be posted 5 minutes before.",
        summary: "All hands meeting rescheduled to Thursday 3 PM",
        author: "admin@company.com",
        channel: "#announcements",
        importance: 0.7,
    },
    {
        content: "The GraphQL migration is complete! All REST endpoints are now deprecated. Migration guide: https://docs.company.com/graphql-migration",
        summary: "GraphQL migration complete - REST endpoints deprecated",
        author: "api-team@company.com",
        channel: "#engineering",
        importance: 0.9,
    },
    {
        content: "Shoutout to @alice for fixing that nasty race condition in the payment service. Great debugging work!",
        summary: "Recognition for Alice fixing race condition in payment service",
        author: "cto@company.com",
        channel: "#kudos",
        importance: 0.55,
    },
];
async function seedTestData() {
    logger.info('Starting to seed test data...');
    try {
        // Generate embeddings (dummy vectors for now - in production these would be real)
        const dummyEmbedding = Array(1536).fill(0).map(() => Math.random() * 0.1);
        for (let i = 0; i < sampleMessages.length; i++) {
            const msg = sampleMessages[i];
            // Create raw event
            const rawEvent = await prisma.rawEvent.create({
                data: {
                    source: 'slack',
                    externalId: `slack_msg_test_${i + 1}`,
                    payload: {
                        text: msg.content,
                        user: msg.author,
                        channel: msg.channel,
                        ts: Date.now() / 1000,
                    },
                    eventType: 'message',
                    processingStatus: 'completed',
                    processedAt: new Date(),
                },
            });
            // Generate content hash (simple hash for now)
            const crypto = require('crypto');
            const contentHash = crypto.createHash('sha256').update(msg.content).digest('hex');
            // Create knowledge chunk with embedding using raw SQL (because Prisma doesn't support vector type well)
            await prisma.$executeRaw `
        INSERT INTO knowledge_chunks (
          id, source_type, source_id, content, content_hash,
          embedding, embedding_model, tier, importance_score, metadata,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          'slack',
          ${rawEvent.id}::uuid,
          ${msg.content},
          ${contentHash},
          ${`[${dummyEmbedding.join(',')}]`}::vector,
          'gemini-text-embedding-004',
          'hot',
          ${msg.importance},
          ${JSON.stringify({
                author: msg.author,
                channel: msg.channel,
                summary: msg.summary,
            })}::jsonb,
          NOW(),
          NOW()
        )
      `;
            logger.info(`Created test record ${i + 1}/20: ${msg.summary.substring(0, 50)}...`);
        }
        logger.info('✅ Successfully seeded 20 test records!');
        // Show stats
        const stats = await prisma.knowledgeChunk.groupBy({
            by: ['tier'],
            _count: true,
        });
        logger.info({ stats }, 'Database stats');
    }
    catch (error) {
        logger.error({ error }, 'Failed to seed test data');
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
// Run the seed
seedTestData().catch((error) => {
    logger.error({ error }, 'Seed script failed');
    process.exit(1);
});

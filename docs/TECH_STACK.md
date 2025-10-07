# Tech Stack - MateAI

## Core Technologies

### Runtime & Language
- **Node.js 20+**: LTS version for stability and modern features
- **TypeScript 5+**: Type safety, better developer experience, refactoring support

### Backend Framework
- **NestJS**:
  - Modular architecture with dependency injection
  - Built-in support for microservices
  - Excellent testing utilities
  - TypeScript-first approach
  - Active community and ecosystem

### Database
- **PostgreSQL 15+**:
  - Robust, battle-tested relational database
  - JSONB support for flexible metadata storage
  - Excellent performance for complex queries
  - Strong ACID guarantees

- **pgvector Extension**:
  - Native vector similarity search
  - Efficient for < 1M vectors
  - No need for separate vector database (initially)
  - Supports multiple distance metrics (cosine, L2, inner product)

### Caching & Job Queue
- **Redis 7+**:
  - In-memory caching for hot data
  - Pub/sub capabilities
  - Foundation for BullMQ

- **BullMQ**:
  - Robust job queue with Redis backend
  - Retry mechanisms with exponential backoff
  - Job scheduling and priorities
  - Built-in monitoring dashboard
  - TypeScript support

### ORM
- **Prisma**:
  - Type-safe database access
  - Auto-generated types from schema
  - Excellent migration system
  - Prisma Studio for debugging
  - Note: For pgvector, we'll use raw SQL queries

### LLM Providers

#### 1. Anthropic Claude (Primary)
**Usage**: Agent orchestration, complex reasoning, tool calling

**Models**:
- `claude-3-5-sonnet-20241022`: Main orchestrator agent
- `claude-3-haiku-20240307`: Quick tasks, sub-agents

**Why Primary**:
- Best-in-class for agent workflows
- Excellent tool calling capabilities
- Large context window (200K)
- Strong reasoning and instruction following

#### 2. Google Gemini (Secondary)
**Usage**: Summarization, embedding generation, content processing

**Models**:
- `gemini-1.5-pro`: Complex summarization
- `gemini-1.5-flash`: Fast summarization
- `text-embedding-004`: 768-dimensional embeddings

**Why Secondary**:
- Cost-effective for embeddings
- Fast processing for summarization
- Excellent multilingual support
- Competitive pricing

#### 3. OpenAI (Fallback)
**Usage**: Backup when primary providers are unavailable

**Models**:
- `gpt-4-turbo-preview`: Complex tasks
- `gpt-3.5-turbo`: Simple tasks
- `text-embedding-3-small`: Embeddings (768d)

### Package Management
- **pnpm**:
  - Faster than npm/yarn
  - Efficient disk space usage (content-addressable storage)
  - Strict by default (no phantom dependencies)
  - Excellent monorepo support

### Testing
- **Jest**:
  - De facto standard for TypeScript/JavaScript
  - Built-in mocking, coverage, snapshots
  - Good integration with NestJS

### Code Quality
- **ESLint**: Linting with TypeScript rules
- **Prettier**: Code formatting
- **TypeScript Compiler**: Strict mode for type checking

## Development Tools

### Containerization
- **Docker**: For PostgreSQL, Redis in development
- **Docker Compose**: Orchestration of local services

### Monitoring & Observability (Future)
- **Pino**: Fast, low-overhead logging
- **OpenTelemetry**: Distributed tracing
- **Prometheus**: Metrics collection
- **Grafana**: Visualization

## Architecture Decisions

### Why Monorepo?
- Shared code and types across packages
- Atomic commits across multiple packages
- Easier dependency management
- Better developer experience

### Why TypeScript over Python?
1. **Better async/await**: Native support, easier to reason about
2. **Type safety**: Critical for large codebases
3. **NestJS**: Enterprise-grade framework
4. **Ecosystem**: Excellent tooling for backend services
5. **Team**: This is primarily an orchestration/integration project, not ML research

### Why Multiple LLM Providers?
1. **Cost optimization**: Use cheaper models where appropriate
2. **Redundancy**: Fallback if one provider has issues
3. **Best tool for job**: Different models excel at different tasks
4. **Vendor lock-in avoidance**: Flexibility to switch

### Why PostgreSQL + pgvector vs Dedicated Vector DB?
**For MVP**: PostgreSQL is sufficient
- Simpler architecture (one less service)
- Good performance for < 1M vectors
- Easier operations and maintenance

**Future Migration Path**: If needed, can migrate to:
- Qdrant
- Weaviate
- Pinecone

The abstraction layer in our code makes this easy.

## Dependency Matrix

| Package | Dependencies |
|---------|-------------|
| **@mateai/core** | Prisma, BullMQ, Redis, Anthropic SDK, Gemini SDK, OpenAI SDK, Zod, Pino |
| **@mateai/api** | @mateai/core, NestJS, Swagger |
| **@mateai/workers** | @mateai/core |
| **@mateai/cli** | @mateai/core, Commander, Chalk, Inquirer |

## Version Pinning Strategy

- **Exact versions** for: LLM SDKs (breaking changes common)
- **Caret (^)** for: Most libraries (minor updates safe)
- **Lockfile**: pnpm-lock.yaml committed to repo

## Performance Considerations

### Database
- Connection pooling (max 10 connections per service)
- Prepared statements via Prisma
- Appropriate indexes on all foreign keys and search columns

### Caching
- Redis for frequently accessed knowledge chunks
- In-memory cache for config and static data
- Cache invalidation on updates

### Job Processing
- Parallel workers (scale horizontally)
- Job priorities (user-facing > background)
- Exponential backoff for retries

### LLM Calls
- Batch embeddings when possible
- Cache embeddings for identical content
- Streaming responses for better UX
- Rate limiting to respect provider limits

## Security Considerations

- Environment variables for all secrets
- No secrets in code or git
- Database connection encryption
- API authentication (JWT)
- Rate limiting on API endpoints
- Input validation with Zod

## Scaling Strategy

**Vertical Scaling** (MVP):
- Increase worker count
- Larger database instance

**Horizontal Scaling** (Production):
- Multiple API instances (stateless)
- Multiple worker instances
- Database read replicas
- Redis cluster

---

Last Updated: 2025-10-07

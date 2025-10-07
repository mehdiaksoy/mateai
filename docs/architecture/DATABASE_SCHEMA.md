# Database Schema Documentation

## Overview

MateAI uses PostgreSQL 15+ with pgvector extension for storing and querying knowledge.

## Tables

### 1. `raw_events`
**Purpose**: Event sourcing - stores all raw events from data sources

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source | VARCHAR(50) | Source system ('slack', 'jira', 'git') |
| event_type | VARCHAR(100) | Type of event ('message', 'commit', 'issue_update') |
| external_id | VARCHAR(255) | ID in the source system |
| payload | JSONB | Raw event data |
| metadata | JSONB | Additional metadata |
| ingested_at | TIMESTAMPTZ | When event was ingested |
| processed_at | TIMESTAMPTZ | When event was processed |
| processing_status | VARCHAR(20) | 'pending', 'processing', 'completed', 'failed' |

**Indexes:**
- `source`
- `event_type`
- `processing_status`
- `ingested_at DESC`
- Composite: `(source, event_type)`

**Relations:**
- One-to-Many with `knowledge_chunks`

---

### 2. `knowledge_chunks`
**Purpose**: Processed, searchable knowledge with vector embeddings

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content | TEXT | Summarized content |
| content_hash | VARCHAR(64) | SHA-256 hash (for deduplication) |
| source_type | VARCHAR(50) | Type of source |
| source_id | UUID | FK to raw_events |
| metadata | JSONB | Flexible metadata (author, timestamp, tags, etc.) |
| importance_score | REAL | 0-1 importance score |
| embedding | VECTOR(768) | 768-dimensional embedding vector |
| embedding_model | VARCHAR(50) | Model used for embedding |
| tier | VARCHAR(20) | 'hot', 'warm', or 'cold' |
| access_count | INT | Number of times accessed |
| last_accessed_at | TIMESTAMPTZ | Last access time |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `content_hash` (UNIQUE)
- `source_type`
- `tier`
- `importance_score DESC`
- `created_at DESC`
- Vector index (IVFFlat) on `embedding`

**Relations:**
- Many-to-One with `raw_events`
- Many-to-Many with `agent_conversations` (via `conversation_chunks`)

---

### 3. `agent_conversations`
**Purpose**: Track agent interactions with users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | VARCHAR(255) | User identifier |
| channel | VARCHAR(100) | Interface ('api', 'slack', 'cli') |
| query | TEXT | User's query |
| retrieved_chunks | UUID[] | Array of knowledge chunk IDs used |
| response | TEXT | Agent's response |
| actions_taken | JSONB | Actions performed by agent |
| model_used | VARCHAR(50) | LLM model used |
| tokens_used | INT | Total tokens consumed |
| latency_ms | INT | Response latency in milliseconds |
| created_at | TIMESTAMPTZ | Timestamp |

**Indexes:**
- `user_id`
- `created_at DESC`
- Composite: `(user_id, created_at)`

**Relations:**
- One-to-Many with `agent_feedback`
- Many-to-Many with `knowledge_chunks` (via `conversation_chunks`)

---

### 4. `conversation_chunks`
**Purpose**: Junction table for conversations and knowledge chunks

| Column | Type | Description |
|--------|------|-------------|
| conversation_id | UUID | FK to agent_conversations |
| chunk_id | UUID | FK to knowledge_chunks |
| relevance_score | REAL | Similarity score |

**Primary Key:** `(conversation_id, chunk_id)`

---

### 5. `agent_feedback`
**Purpose**: User feedback for continuous improvement

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to agent_conversations |
| rating | SMALLINT | 1-5 rating |
| feedback_text | TEXT | Optional text feedback |
| created_at | TIMESTAMPTZ | Timestamp |

**Indexes:**
- `conversation_id`
- `rating`
- `created_at DESC`

**Relations:**
- Many-to-One with `agent_conversations`

---

### 6. `processing_jobs`
**Purpose**: Track background job execution (optional, complements BullMQ)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_type | VARCHAR(50) | Type of job ('summarization', 'embedding') |
| event_id | UUID | FK to raw_events (if applicable) |
| status | VARCHAR(20) | 'pending', 'running', 'completed', 'failed' |
| input_data | JSONB | Job input |
| output_data | JSONB | Job output |
| error | TEXT | Error message if failed |
| started_at | TIMESTAMPTZ | Job start time |
| completed_at | TIMESTAMPTZ | Job completion time |
| duration_ms | INT | Duration in milliseconds |
| attempts | INT | Number of attempts |
| max_attempts | INT | Maximum retry attempts |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `job_type`
- `status`
- `created_at DESC`
- `event_id`

---

## Vector Search

### pgvector Extension

We use pgvector for efficient similarity search:

```sql
CREATE EXTENSION vector;
```

### Vector Index

```sql
CREATE INDEX ON knowledge_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Index Type:** IVFFlat (Inverted File with Flat compression)
**Distance Metric:** Cosine similarity
**Lists:** 100 (tune based on data size)

### Query Pattern

```sql
SELECT id, content, metadata,
       1 - (embedding <=> $1::vector) as similarity
FROM knowledge_chunks
WHERE tier IN ('hot', 'warm')
ORDER BY embedding <=> $1::vector
LIMIT 20;
```

**Operators:**
- `<=>`: Cosine distance (1 - cosine similarity)
- `<->`: Euclidean (L2) distance
- `<#>`: Inner product

---

## Data Flow

```
Data Source → raw_events
                 ↓
         [Processing Pipeline]
                 ↓
         knowledge_chunks ← [Vector Embedding]
                 ↓
         conversation_chunks → agent_conversations
                                      ↓
                                agent_feedback
```

---

## Memory Tiering

Knowledge chunks are organized in tiers based on usage:

| Tier | Criteria | Query Priority |
|------|----------|----------------|
| **hot** | Recent (< 7 days) OR frequently accessed | Always searched |
| **warm** | 7-30 days, moderate access | Searched if needed |
| **cold** | > 30 days, rarely accessed | Searched only on demand |

**Tiering Process:**
- Daily cron job evaluates and updates tiers
- Scoring based on: recency, access_count, importance_score

---

## Performance Considerations

### Connection Pooling
- Maximum 10 connections per service
- Timeout: 30 seconds

### Query Optimization
- All foreign keys have indexes
- Composite indexes for common query patterns
- JSONB GIN indexes (can be added later if needed)

### Vector Search Performance
- IVFFlat suitable for < 1M vectors
- For larger datasets, consider HNSW index or dedicated vector DB

### Partitioning (Future)
If `raw_events` or `agent_conversations` grow large:
- Partition by date (monthly or quarterly)
- Archive old partitions to cold storage

---

## Backup Strategy

### Development
- Docker volumes (`postgres_data`)
- Manual backups via `pg_dump`

### Production
- Automated daily backups
- Point-in-time recovery (PITR)
- Separate backup storage

---

## Migration Strategy

Prisma migrations are used for schema changes:

```bash
# Create a new migration
pnpm --filter @mateai/core prisma migrate dev --name description

# Apply migrations in production
pnpm --filter @mateai/core prisma migrate deploy
```

### Raw SQL for pgvector

Since Prisma doesn't fully support pgvector, use raw SQL:

```typescript
// Create vector index
await prisma.$executeRaw`
  CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
`;

// Vector similarity search
const results = await prisma.$queryRaw`
  SELECT id, content,
         1 - (embedding <=> ${embedding}::vector) as similarity
  FROM knowledge_chunks
  WHERE tier = 'hot'
  ORDER BY embedding <=> ${embedding}::vector
  LIMIT ${limit}
`;
```

---

## Schema Evolution

### Adding Columns
1. Add to Prisma schema
2. Create migration
3. Deploy with zero downtime (add as nullable first)

### Adding Tables
1. Design table in Prisma schema
2. Create migration
3. Deploy and populate

### Modifying Embeddings
If changing embedding dimensions:
1. Add new column `embedding_v2 vector(NEW_DIM)`
2. Backfill incrementally
3. Switch application code
4. Drop old column

---

Last Updated: 2025-10-07

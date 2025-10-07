# 🧪 Testing Guide

## Integration Test

تست کامل pipeline از ابتدا تا انتها.

### پیش‌نیازها

1. **Docker Services باید Running باشند:**
```bash
cd infrastructure/docker
docker-compose up -d
```

2. **API Keys:**
```bash
# Required
export GOOGLE_API_KEY="your-google-api-key"

# Optional (for agent test)
export ANTHROPIC_API_KEY="your-anthropic-api-key"
```

3. **Database URL (optional):**
```bash
# Default:
export DATABASE_URL="postgresql://mateai:mateai_dev_password@localhost:5432/mateai?schema=public"
```

### اجرای تست

#### روش 1: با Script
```bash
./scripts/test-integration.sh
```

#### روش 2: دستی
```bash
# Build
pnpm build

# Run test
cd packages/core
NODE_ENV=test npx ts-node tests/integration-test.ts
```

### مراحل تست

تست این موارد را بررسی می‌کند:

1. ✅ **Config & Database**
   - Load کردن configuration
   - اتصال به PostgreSQL
   - بررسی pgvector extension

2. ✅ **LLM Clients**
   - Anthropic Claude (summarization)
   - Google Gemini (embeddings)

3. ✅ **Ingestion**
   - ساخت raw events
   - ذخیره در database

4. ✅ **Processing Pipeline**
   - **Enrichment**: استخراج entities و محاسبه importance
   - **Summarization**: خلاصه‌سازی با Claude
   - **Embedding**: تولید vector embeddings با Gemini
   - **Storage**: ذخیره در vector store

5. ✅ **Memory Retrieval**
   - جستجوی semantic
   - یافتن chunks مرتبط
   - محاسبه similarity scores

6. ✅ **Claude SDK Agent** (اگر ANTHROPIC_API_KEY موجود باشد)
   - ساخت agent با memory integration
   - پردازش query واقعی
   - استفاده از MCP tools
   - لاگ کردن تمام steps

### خروجی نمونه

```
🎯 Starting Integration Test

============================================================

📝 Step 1: Loading Configuration
✅ Configuration loaded

🗄️  Step 2: Connecting to Database
✅ Database connected
✅ pgvector extension verified

🤖 Step 3: Initializing LLM Clients
✅ LLM clients initialized (Anthropic + Google)

📥 Step 4: Creating Test Raw Events
  ✅ Created raw event: abc12345
  ✅ Created raw event: def67890
  ✅ Created raw event: ghi13579

⚙️  Step 5: Processing Events through Pipeline

  Processing event abc12345...
    → Enrichment...
      ✅ Extracted text: We need to implement authentication...
      ✅ Importance: 0.75
    → Summarization...
      ✅ Summary: Team discusses API authentication options...
    → Embedding...
      ✅ Embedding: 768 dimensions
    → Storing in vector store...
      ✅ Stored chunk: xyz98765

✅ All events processed successfully!

🔍 Step 6: Testing Memory Retrieval

  Testing semantic search...
  ✅ Found 3 relevant chunks
    [1] Similarity: 87.5%
        Content: We need to implement authentication for the API...
    [2] Similarity: 85.2%
        Content: JWT is simpler for our use case...
    [3] Similarity: 83.1%
        Content: Agreed. Let's use JWT with RS256...

🤖 Step 7: Testing Claude SDK Agent

  Creating agent...
  ✅ Agent created

  Sending query to agent...
  Query: "What did the team discuss about API authentication?"

  📝 Agent Response:
  ==========================================================
  Based on the team's recent discussions, here's what was
  decided about API authentication:

  1. **Choice: JWT over OAuth2**
     The team decided to use JWT (JSON Web Tokens) for
     authentication because it's simpler for the current
     use case.

  2. **Security: RS256 Algorithm**
     They chose to use RS256 (RSA Signature with SHA-256)
     for better security instead of the simpler HS256.

  3. **Future Plans**
     OAuth2 was considered but postponed - they can add it
     later if needed.
  ==========================================================

  ⏱️  Duration: 3245ms
  📊 Steps taken: 5

  🔍 Agent Steps:
    1. thinking - {"action":"loaded_memory_context","chunks":3}
    2. tool_use - {"tool":"search_memory","input":{"query":"API au...
    3. message - {"role":"assistant","contentLength":245}
    4. tool_use - {"tool":"get_recent_events","input":{"source":"s...
    5. message - {"role":"assistant","contentLength":487}

============================================================
✅ Integration Test Complete!
============================================================

📊 Summary:
  • Raw events created: 3
  • Events processed: 3
  • Knowledge chunks stored: 3
  • Memory retrieval: ✅
  • Agent test: ✅

🎉 All systems working correctly!
```

### Cleanup

برای پاک کردن test data:

```sql
-- Connect to database
psql $DATABASE_URL

-- Delete test events
DELETE FROM knowledge_chunks WHERE metadata->>'test' = 'true';
DELETE FROM raw_events WHERE metadata->>'test' = 'true';
```

یا از pgAdmin/DBeaver استفاده کنید.

### Troubleshooting

#### خطا: "pgvector extension not installed"
```bash
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### خطا: "LLM API error"
- بررسی کنید API keys صحیح هستند
- اینترنت متصل باشد
- Rate limit نخورده باشید

#### خطا: "Database connection failed"
```bash
# Restart PostgreSQL
cd infrastructure/docker
docker-compose restart postgres
```

#### Agent test skip می‌شه
- `ANTHROPIC_API_KEY` را set کنید
- این optional است - بقیه تست‌ها اجرا می‌شوند

### تست دستی Agent

اگر می‌خواهید فقط agent را تست کنید:

```typescript
import { createClaudeSDKAgent, MemoryRetrievalService } from '@mateai/core';

const agent = createClaudeSDKAgent(retrievalService);

const response = await agent.process({
  prompt: 'Your question here',
  includeMemoryContext: true,
});

console.log(response.content);
console.log('Steps:', response.steps);
```

## Unit Tests (Future)

```bash
pnpm test
```

## E2E Tests (Future)

```bash
pnpm test:e2e
```

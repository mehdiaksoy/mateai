# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**MateAI** is an AI-powered collective memory system that automatically captures, processes, and retrieves knowledge from team tools (Slack, Jira, Git, etc.).

## Tech Stack

- **Runtime**: Node.js 20+ (LTS)
- **Language**: TypeScript 5+
- **Framework**: NestJS
- **Database**: PostgreSQL 15+ with pgvector extension
- **ORM**: Prisma
- **Cache/Queue**: Redis 7+ with BullMQ
- **LLM Providers**:
  - Anthropic Claude (primary - orchestration)
  - Google Gemini (secondary - summarization/embedding)
  - OpenAI (fallback)
- **Package Manager**: pnpm
- **Testing**: Jest
- **Linting**: ESLint + Prettier

## Project Structure

```
mateai/
├── packages/
│   ├── core/          # Core business logic, adapters, processors, memory
│   ├── api/           # NestJS REST API server
│   ├── workers/       # Background workers for processing
│   └── cli/           # Command-line interface
├── docs/              # Documentation
├── infrastructure/    # Docker, K8s configs
└── scripts/           # Automation scripts
```

## Common Commands

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
cd infrastructure/docker && docker-compose up -d

# Run database migrations
pnpm --filter @mateai/core prisma migrate dev

# Development
pnpm dev                    # Start all packages in watch mode
pnpm --filter @mateai/api dev    # Start specific package

# Build
pnpm build

# Test
pnpm test

# Lint & Format
pnpm lint
pnpm format
```

## Key Files

- **Implementation Plan**: `IMPLEMENTATION_PLAN.md` - Complete step-by-step roadmap
- **Current Status**: `CURRENT_STATUS.md` - Real-time progress tracking
- **Environment**: `.env` (copy from `.env.example`)
- **Database Schema**: `packages/core/prisma/schema.prisma`

## Architecture Layers

1. **Data Ingestion**: Adapters for Slack, Jira, Git → Queue
2. **Processing Pipeline**: Enrichment → Summarization → Embedding → Storage
3. **Memory System**: Hierarchical (Hot/Warm/Cold) with vector search
4. **Agent Layer**: Orchestrator + Tools + Sub-agents
5. **User Interface**: API + Slack Bot + CLI

## Development Workflow

1. All changes should follow the implementation plan in `IMPLEMENTATION_PLAN.md`
2. Update `CURRENT_STATUS.md` after completing each phase/section
3. Write tests for each component before moving forward
4. Document architecture decisions in `docs/architecture/`

## Important Notes

- Use Persian language for communication with the user
- Focus on extensibility and clean architecture
- Each component should be independently testable
- Always update documentation when making changes

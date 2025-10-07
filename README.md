# MateAI 🤖

AI-powered collective memory system for teams. Automatically captures, processes, and retrieves knowledge from Slack, Jira, Git, and more.

## 🏗️ Architecture

MateAI consists of:
- **Knowledge Pipeline**: Ingests data from various sources, processes and stores as searchable knowledge
- **Agent Layer**: Claude-powered orchestrator with specialized tools and sub-agents
- **Memory System**: Hierarchical storage with vector search capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (LTS)
- pnpm 8+
- Docker & Docker Compose

### Installation

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
cd infrastructure/docker
docker-compose up -d

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
pnpm --filter @mateai/core prisma migrate dev

# Start development servers
pnpm dev
```

## 📦 Packages

- **@mateai/core**: Core business logic, adapters, processors, memory system
- **@mateai/api**: REST API server (NestJS)
- **@mateai/workers**: Background workers for data processing
- **@mateai/cli**: Command-line interface for testing and debugging

## 🧪 Development

```bash
# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Build all packages
pnpm build
```

## 📚 Documentation

See `/docs` directory for detailed documentation:
- [Architecture Overview](./docs/architecture/)
- [API Documentation](./docs/api/)
- [Deployment Guide](./docs/deployment/)

## 🔑 Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `ANTHROPIC_API_KEY`: Claude API key
- `GOOGLE_API_KEY`: Gemini API key
- `OPENAI_API_KEY`: OpenAI API key (fallback)

## 📖 Implementation Plan

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed implementation roadmap.

## 📝 License

MIT

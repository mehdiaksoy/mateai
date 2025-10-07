#!/bin/bash

# Integration Test Runner
# Tests the complete MateAI pipeline

set -e

echo "🚀 MateAI Integration Test"
echo "=========================="
echo ""

# Check if Docker services are running
echo "📋 Checking prerequisites..."

if ! docker ps | grep -q postgres; then
    echo "❌ PostgreSQL not running!"
    echo "   Start with: cd infrastructure/docker && docker-compose up -d postgres"
    exit 1
fi

if ! docker ps | grep -q redis; then
    echo "❌ Redis not running!"
    echo "   Start with: cd infrastructure/docker && docker-compose up -d redis"
    exit 1
fi

echo "✅ Docker services running"

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set, using default"
    export DATABASE_URL="postgresql://mateai:mateai_dev_password@localhost:5432/mateai?schema=public"
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY not set - agent test will be skipped"
    echo "   Set it with: export ANTHROPIC_API_KEY=your-key"
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ GOOGLE_API_KEY is required for embeddings!"
    echo "   Set it with: export GOOGLE_API_KEY=your-key"
    exit 1
fi

echo ""
echo "🏗️  Building project..."
pnpm build

echo ""
echo "🧪 Running integration test..."
echo ""

# Get script directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/packages/core"
NODE_ENV=test npx ts-node tests/integration-test.ts

echo ""
echo "✅ Test complete!"

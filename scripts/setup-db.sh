#!/bin/bash

# Script to setup database with pgvector extension
# Run this after Docker services are up

set -e

echo "🔧 Setting up MateAI database..."
echo ""

# Check if PostgreSQL container is running
if ! docker ps | grep -q mateai-postgres; then
    echo "❌ PostgreSQL container is not running!"
    echo "Please start Docker services first:"
    echo "  cd infrastructure/docker && docker compose up -d"
    exit 1
fi

echo "✅ PostgreSQL container is running"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec mateai-postgres pg_isready -U mateai -d mateai > /dev/null 2>&1; do
    sleep 1
done
echo "✅ PostgreSQL is ready"
echo ""

# Enable pgvector extension
echo "📦 Enabling pgvector extension..."
docker exec -i mateai-postgres psql -U mateai -d mateai << EOF
CREATE EXTENSION IF NOT EXISTS vector;
\dx
EOF

echo ""
echo "✅ pgvector extension enabled"
echo ""

# Run Prisma migrations
echo "🗄️  Running Prisma migrations..."
cd "$(dirname "$0")/.."
pnpm --filter @mateai/core prisma migrate dev --name init

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  - Add your API keys to .env file"
echo "  - Start development: pnpm dev"

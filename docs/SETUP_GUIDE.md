# Setup Guide - MateAI

این راهنما برای راه‌اندازی کامل محیط Development است.

## پیش‌نیازها

### نصب ابزارهای مورد نیاز

1. **Node.js 20+ و pnpm**
```bash
# Check versions
node --version  # Should be 20+
pnpm --version  # Should be 8+

# If pnpm not installed:
npm install -g pnpm
```

2. **Docker Desktop**
- دانلود از: https://www.docker.com/products/docker-desktop
- بعد از نصب، Docker Desktop را باز کنید و منتظر بمانید تا start شود

3. **Git**
```bash
git --version
```

## راه‌اندازی اولیه

### 1. Clone و نصب dependencies

```bash
# Navigate to project
cd /Users/mate/dev/mateai

# Install all dependencies
pnpm install
```

### 2. شروع Services (PostgreSQL + Redis)

**ابتدا مطمئن شوید Docker Desktop روشن است!**

```bash
# Start services
cd infrastructure/docker
docker compose up -d

# Check if services are running
docker compose ps

# View logs (optional)
docker compose logs -f
```

انتظار داشته باشید:
```
NAME                 STATUS
mateai-postgres      Up (healthy)
mateai-redis         Up (healthy)
```

### 3. تنظیم متغیرهای محیطی

```bash
# Navigate back to root
cd ../..

# Edit .env file
nano .env  # or open with your editor
```

**حداقل این موارد را پر کنید:**
```env
DATABASE_URL="postgresql://mateai:mateai_dev_password@localhost:5432/mateai?schema=public"
ANTHROPIC_API_KEY="your-actual-key"
GOOGLE_API_KEY="your-actual-key"
```

### 4. راه‌اندازی Database

```bash
# Generate Prisma Client
pnpm --filter @mateai/core prisma generate

# Enable pgvector extension + Run migrations
pnpm --filter @mateai/core prisma migrate dev --name init

# Verify database
pnpm --filter @mateai/core prisma studio
# این یک UI در browser باز می‌کند
```

## تست راه‌اندازی

### 1. چک کردن اتصال به Database

```bash
# Test PostgreSQL connection
docker exec -it mateai-postgres psql -U mateai -d mateai -c "\dt"
# باید لیست جداول را نشان دهد
```

### 2. چک کردن Redis

```bash
# Test Redis
docker exec -it mateai-redis redis-cli ping
# Expected: PONG
```

### 3. Build پروژه

```bash
# Build all packages
pnpm build

# If successful, you should see dist/ folders in each package
```

## توسعه (Development)

### شروع Development Mode

```bash
# Terminal 1: Start infrastructure (if not running)
cd infrastructure/docker
docker compose up

# Terminal 2: Start development
cd ../..
pnpm dev
```

این دستور تمام packages را در watch mode اجرا می‌کند.

### کار با packages خاص

```bash
# فقط core
pnpm --filter @mateai/core dev

# فقط API
pnpm --filter @mateai/api dev

# فقط workers
pnpm --filter @mateai/workers dev
```

### دستورات مفید

```bash
# Lint کردن
pnpm lint

# Format کردن
pnpm format

# تست‌ها
pnpm test

# Prisma Studio (Database UI)
pnpm --filter @mateai/core prisma studio

# Clean build outputs
pnpm clean
```

## مشکلات رایج (Troubleshooting)

### 1. Docker services start نمی‌شوند

```bash
# Check if Docker Desktop is running
docker ps

# If not working, restart Docker Desktop
# Then try again:
cd infrastructure/docker
docker compose down
docker compose up -d
```

### 2. Database connection error

```bash
# Check if PostgreSQL is running
docker compose ps

# Check DATABASE_URL in .env
# Make sure port 5432 is not used by another process
lsof -i :5432
```

### 3. Prisma generate fails

```bash
# Rebuild dependencies
pnpm --filter @mateai/core rebuild

# Then try again
pnpm --filter @mateai/core prisma generate
```

### 4. Port conflicts

اگر پورت‌ها قبلاً استفاده شده‌اند:

```bash
# Check ports
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :3000  # API

# Edit docker-compose.yml to use different ports if needed
```

### 5. pgvector extension نصب نشده

```bash
# Connect to database
docker exec -it mateai-postgres psql -U mateai -d mateai

# In psql prompt:
CREATE EXTENSION IF NOT EXISTS vector;
\dx  # List extensions, should see 'vector'
\q   # Exit
```

## Cleanup (پاک کردن همه چیز)

### حذف containers و volumes

```bash
cd infrastructure/docker
docker compose down -v  # -v removes volumes (deletes data!)
```

### حذف node_modules و build outputs

```bash
pnpm clean
rm -rf node_modules
rm -rf packages/*/node_modules
```

### شروع از صفر

```bash
# Clean everything
docker compose down -v
pnpm clean
rm -rf node_modules packages/*/node_modules

# Start fresh
pnpm install
docker compose up -d
pnpm --filter @mateai/core prisma migrate dev
```

## بررسی وضعیت سیستم

یک اسکریپت ساده برای چک کردن همه چیز:

```bash
# Create a status check script
cat > scripts/check-status.sh << 'EOF'
#!/bin/bash

echo "=== MateAI Status Check ==="
echo ""

echo "1. Node.js version:"
node --version

echo ""
echo "2. pnpm version:"
pnpm --version

echo ""
echo "3. Docker status:"
docker ps --filter "name=mateai"

echo ""
echo "4. PostgreSQL connection:"
docker exec mateai-postgres pg_isready -U mateai || echo "❌ PostgreSQL not ready"

echo ""
echo "5. Redis connection:"
docker exec mateai-redis redis-cli ping || echo "❌ Redis not ready"

echo ""
echo "6. Prisma Client generated:"
[ -d "packages/core/node_modules/.prisma" ] && echo "✅ Yes" || echo "❌ No"

echo ""
echo "=== End Status Check ==="
EOF

chmod +x scripts/check-status.sh
./scripts/check-status.sh
```

## مراحل بعدی

بعد از راه‌اندازی موفق:

1. ✅ همه services در حال اجرا هستند
2. ✅ Database migrations اجرا شده
3. ✅ Prisma Client تولید شده
4. ➡️  شروع Phase 1: پیاده‌سازی Core Infrastructure

به `IMPLEMENTATION_PLAN.md` مراجعه کنید برای مراحل بعدی.

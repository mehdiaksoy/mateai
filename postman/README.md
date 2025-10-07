# MateAI Postman Collection

این کالکشن شامل تمام اندپوینت‌های REST API پروژه MateAI است.

## 📦 نصب و راه‌اندازی

### 1. Import کردن Collection

1. Postman را باز کنید
2. بر روی **Import** کلیک کنید
3. فایل `MateAI-API.postman_collection.json` را انتخاب کنید
4. فایل `MateAI-Local.postman_environment.json` را هم import کنید

### 2. انتخاب Environment

1. در گوشه بالا سمت راست، از dropdown محیط **"MateAI - Local"** را انتخاب کنید
2. اطمینان حاصل کنید که سرور روی پورت 3000 در حال اجرا است

### 3. شروع تست

حالا می‌توانید اندپوینت‌ها را تست کنید!

---

## 📋 لیست اندپوینت‌ها

### Health Checks (4 اندپوینت)

| نام | Method | مسیر | توضیحات |
|-----|--------|------|---------|
| Basic Health | GET | `/api/health` | چک ساده سلامت سرور |
| Detailed Health | GET | `/api/health/detailed` | چک کامل شامل دیتابیس |
| Readiness Probe | GET | `/api/health/ready` | Kubernetes readiness |
| Liveness Probe | GET | `/api/health/live` | Kubernetes liveness |

### Agent (3 اندپوینت)

| نام | Method | مسیر | توضیحات |
|-----|--------|------|---------|
| Query Agent | POST | `/api/agent/query` | سوال با context حافظه |
| Simple Question | POST | `/api/agent/query` | سوال ساده بدون context |
| With User Context | POST | `/api/agent/query` | سوال با user ID و context |

**نمونه Request Body:**
```json
{
  "query": "What did the team discuss about API authentication?",
  "userId": "user_123",
  "includeMemoryContext": true
}
```

### Memory (6 اندپوینت)

| نام | Method | مسیر | توضیحات |
|-----|--------|------|---------|
| Search Memory | POST | `/api/memory/search` | جستجوی معنایی |
| Filtered Search | POST | `/api/memory/search` | جستجو با فیلتر source |
| High Similarity | POST | `/api/memory/search` | جستجو با دقت بالا |
| Statistics | GET | `/api/memory/stats` | آمار کلی حافظه |
| Recent Events | GET | `/api/memory/recent?limit=10` | رویدادهای اخیر |
| Large Batch | GET | `/api/memory/recent?limit=50` | دسته بزرگ رویدادها |

**نمونه Search Request:**
```json
{
  "query": "authentication implementation",
  "limit": 10,
  "minSimilarity": 0.7,
  "sourceTypes": ["slack"]
}
```

### Documentation (2 اندپوینت)

| نام | Method | مسیر | توضیحات |
|-----|--------|------|---------|
| Swagger UI | GET | `/api/docs` | مستندات تعاملی |
| OpenAPI JSON | GET | `/api/docs-json` | فایل OpenAPI |

---

## 🔧 تنظیمات Environment

### متغیرهای موجود:

- **base_url**: `http://localhost:3000` (آدرس سرور لوکال)
- **api_version**: `v1` (نسخه API)
- **user_id**: `test_user_123` (شناسه کاربر تست)

### تغییر Environment برای Production:

1. یک environment جدید بسازید
2. `base_url` را به آدرس production تغییر دهید
3. در صورت نیاز، توکن احراز هویت اضافه کنید

---

## 🧪 نمونه‌های تست

### 1. چک سلامت سرور
```
GET http://localhost:3000/api/health
```
**پاسخ مورد انتظار:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### 2. جستجو در حافظه
```
POST http://localhost:3000/api/memory/search
Content-Type: application/json

{
  "query": "database migration",
  "limit": 5,
  "minSimilarity": 0.7
}
```

### 3. سوال از Agent
```
POST http://localhost:3000/api/agent/query
Content-Type: application/json

{
  "query": "Summarize recent team discussions",
  "userId": "user_123",
  "includeMemoryContext": true
}
```

---

## 📊 Response Formats

### Success Response:
```json
{
  "response": "...",
  "durationMs": 1234,
  "steps": 3
}
```

### Error Response:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "details": {...},
  "timestamp": "2025-10-07T12:00:00.000Z",
  "path": "/api/agent/query"
}
```

---

## 🚀 نکات مهم

1. **سرور را اول اجرا کنید:**
   ```bash
   cd packages/api
   pnpm build
   pnpm start
   ```

2. **چک کنید سرور در حال اجرا است:**
   - مراجعه به: http://localhost:3000/api/health
   - باید پاسخ `{"status":"ok"}` را ببینید

3. **Swagger UI:**
   - برای مشاهده مستندات کامل: http://localhost:3000/api/docs
   - می‌توانید مستقیماً از Swagger هم تست کنید

4. **Database:**
   - اطمینان حاصل کنید PostgreSQL در حال اجرا است
   - در صورت خالی بودن دیتابیس، نتایج جستجو خالی خواهد بود

---

## 🐛 عیب‌یابی

### مشکل: Connection Refused
- چک کنید سرور در حال اجرا باشد
- پورت 3000 را بررسی کنید
- فایروال را چک کنید

### مشکل: Empty Results
- دیتابیس خالی است
- ابتدا داده‌های تستی اضافه کنید
- یا از integration test استفاده کنید

### مشکل: Validation Error
- Body request را بررسی کنید
- فیلدهای required را چک کنید
- نوع داده‌ها را کنترل کنید

---

## 📞 پشتیبانی

برای مشکلات یا سوالات:
1. مستندات اصلی پروژه را بخوانید: `/IMPLEMENTATION_PLAN.md`
2. لاگ‌های سرور را بررسی کنید
3. Swagger UI را برای validation امتحان کنید

---

**نسخه**: 0.1.0
**تاریخ به‌روزرسانی**: 2025-10-07

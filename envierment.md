# Environment Configuration

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026

---

## 1. Overview

Environment configuration is managed via `.env` files per environment. All environment variables must be defined in `.env.example` with placeholder values. Never commit actual secrets to git.

---

## 2. Environment Files

| File | Environment | Committed? |
|---|---|---|
| `.env.example` | Template for all envs | ✅ Yes |
| `.env.local` | Local development | ❌ No (.gitignore) |
| `.env.test` | Test/CI environment | ❌ No (injected via CI secrets) |
| `.env.production` | Production | ❌ No (injected via deploy platform) |

---

## 3. Complete `.env.example`

```dotenv
# ═══════════════════════════════════════════════════
# KNOWBASE — Environment Variables Template
# Copy this file to .env.local and fill in values
# NEVER commit .env.local or real secrets to git
# ═══════════════════════════════════════════════════

# ────────────────────────────────────────────────────
# APPLICATION
# ────────────────────────────────────────────────────
NODE_ENV=development                   # development | test | production
APP_PORT=3001                          # API server port
WORKER_CONCURRENCY=2                   # Number of concurrent BullMQ workers

# ────────────────────────────────────────────────────
# JWT AUTHENTICATION
# ────────────────────────────────────────────────────
JWT_SECRET=your-super-secret-key-here  # Min 32 chars; use a random string in prod
JWT_EXPIRES_IN=7d                      # Token expiry (e.g. 7d, 24h, 30d)

# ────────────────────────────────────────────────────
# DATABASE — PostgreSQL + pgvector
# ────────────────────────────────────────────────────
DATABASE_URL=postgresql://knowbase:knowbase_dev@localhost:5432/knowbase
DB_HOST=localhost
DB_PORT=5432
DB_NAME=knowbase
DB_USER=knowbase
DB_PASSWORD=knowbase_dev

# Test database (separate DB for Jest integration tests)
TEST_DATABASE_URL=postgresql://knowbase:knowbase_dev@localhost:5432/knowbase_test

# ────────────────────────────────────────────────────
# REDIS
# ────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                        # Leave empty for local dev without auth

# ────────────────────────────────────────────────────
# GROQ AI (LLM + Embeddings)
# ────────────────────────────────────────────────────
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_LLM_MODEL=llama3-8b-8192         # Options: llama3-8b-8192 | mixtral-8x7b-32768
GROQ_EMBEDDING_MODEL=                  # Set if Groq exposes standalone embedding endpoint

# ────────────────────────────────────────────────────
# FILE UPLOAD
# ────────────────────────────────────────────────────
UPLOAD_DIR=./uploads                   # Relative to packages/api root
MAX_FILE_SIZE_BYTES=10485760           # 10MB = 10 * 1024 * 1024
ALLOWED_FILE_TYPES=pdf,docx,txt

# ────────────────────────────────────────────────────
# RAG / SCORING ENGINE
# ────────────────────────────────────────────────────
RAG_TOP_K=5                            # Top-K chunks to retrieve per query
RAG_SCORE_THRESHOLD=0.70               # Minimum cosine similarity score
RAG_MAX_CONTEXT_TOKENS=6000            # Max tokens to send to LLM as context
CHUNK_SIZE_TOKENS=500                  # Target chunk size in tokens
CHUNK_OVERLAP_TOKENS=50               # Overlap between consecutive chunks

# ────────────────────────────────────────────────────
# pgvector HNSW Index Settings
# ────────────────────────────────────────────────────
PGVECTOR_HNSW_M=16                     # Max connections per HNSW node
PGVECTOR_HNSW_EF_CONSTRUCTION=64       # Build-time search depth
PGVECTOR_EF_SEARCH=40                  # Query-time search depth (SET hnsw.ef_search)

# ────────────────────────────────────────────────────
# SUGGESTION CACHING
# ────────────────────────────────────────────────────
SUGGESTION_CACHE_TTL=86400             # Redis TTL in seconds (24 hours)
SUGGESTION_COUNT=3                     # Number of suggestions per document

# ────────────────────────────────────────────────────
# CORS
# ────────────────────────────────────────────────────
CORS_ORIGIN=http://localhost:5173      # Frontend dev URL (update for production)

# ────────────────────────────────────────────────────
# RATE LIMITING
# ────────────────────────────────────────────────────
RATE_LIMIT_AUTH_MAX=10                 # Max auth requests per window per IP
RATE_LIMIT_WINDOW_MS=60000             # Rate limit window: 60 seconds

# ────────────────────────────────────────────────────
# LOGGING
# ────────────────────────────────────────────────────
LOG_LEVEL=debug                        # debug | info | warn | error
LOG_PRETTY=true                        # Pretty print in dev; set false in production

# ────────────────────────────────────────────────────
# ADMIN SEED
# ────────────────────────────────────────────────────
ADMIN_EMAIL=admin@knowbase.local       # Used in seed script
ADMIN_PASSWORD=AdminSecurePass123!     # Used in seed script — change in production
ADMIN_NAME=Admin

# ────────────────────────────────────────────────────
# FRONTEND (Vite — prefix with VITE_ to expose to browser)
# ────────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## 4. Environment-Specific Configuration

### 4.1 Local Development

```dotenv
NODE_ENV=development
LOG_LEVEL=debug
LOG_PRETTY=true
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://knowbase:knowbase_dev@localhost:5432/knowbase
REDIS_URL=redis://localhost:6379
```

All services run via Docker Compose:
```bash
# Start infrastructure (PostgreSQL with pgvector + Redis)
docker compose up postgres redis -d

# Then run app packages from root
npm run dev
```

> **Note:** The Docker Compose uses the `pgvector/pgvector:pg16` image which has pgvector pre-installed. No separate vector DB container is needed.

### 4.2 CI / Test Environment

```dotenv
NODE_ENV=test
LOG_LEVEL=error      # Suppress noise during test runs
LOG_PRETTY=false
DATABASE_URL=postgresql://knowbase:test@localhost:5432/knowbase_test
REDIS_URL=redis://localhost:6379
```

**Test database setup:**
```bash
# Create test DB before running tests
DATABASE_URL=$TEST_DATABASE_URL npx knex migrate:latest
```

**Jest auto-setup:** `jest.config.js` loads `.env.test` before test suite.

### 4.3 Production

Production secrets are **never in files** — they are injected via the deployment platform:
- **Railway / Fly.io:** Environment variables set in the platform dashboard
- **Vercel (frontend):** VITE_ prefixed vars set in project settings

**Production-specific overrides:**
```dotenv
NODE_ENV=production
LOG_LEVEL=info
LOG_PRETTY=false
CORS_ORIGIN=https://knowbase.yourdomain.com
```

**PostgreSQL provider for production:**
- Ensure the provider supports the pgvector extension (Neon, Supabase, Railway PostgreSQL, or self-hosted with pgvector installed)

---

## 5. Secret Management Rules

| Rule | Description |
|---|---|
| Never commit secrets | `.env.local`, `.env.production` are gitignored |
| Use `.env.example` | Document every variable with a description |
| Rotate on breach | Change `JWT_SECRET`, `GROQ_API_KEY`, `DB_PASSWORD` immediately if exposed |
| Scope by environment | Different DB credentials per environment (dev/test/prod) |
| Strong JWT secret | Minimum 32 characters; generate with `openssl rand -hex 32` |
| Production DB user | Create a dedicated DB user with minimal required permissions |

---

## 6. Service URLs by Environment

| Service | Local Development | Production |
|---|---|---|
| Frontend | `http://localhost:5173` | `https://knowbase.yourdomain.com` |
| API Server | `http://localhost:3001` | `https://api.knowbase.yourdomain.com` |
| PostgreSQL (+ pgvector) | `localhost:5432` | Managed DB (Neon/Supabase/Railway with pgvector) |
| Redis | `localhost:6379` | Managed Redis (Upstash/Railway) |

---

## 7. Quick Start Commands

```bash
# 1. Clone repo
git clone <repo-url>
cd knowbase

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local — fill in GROQ_API_KEY, and any other required values

# 3. Start infrastructure (PostgreSQL with pgvector + Redis)
docker compose up postgres redis -d

# 4. Install dependencies
npm install

# 5. Run database migrations (includes pgvector extension + all tables)
cd packages/api && npm run migrate && npm run seed

# 6. Start all services
cd ../../ && npm run dev
# Apps start at:
# - Web:    http://localhost:5173
# - API:    http://localhost:3001
# - Worker: background process
```

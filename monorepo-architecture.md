# Monorepo Architecture

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026
**Strategy:** Turborepo (or npm workspaces)

---

## 1. Monorepo Philosophy

The project uses a **monorepo structure** to:
- Share TypeScript types between frontend and backend
- Run tests, builds, and lint commands across packages from a single root
- Enforce consistent tooling (ESLint, Prettier, Jest config) across all packages
- Enable atomic commits that span both frontend and backend changes

---

## 2. Top-Level Directory Structure

```
knowbase/                               ← Repository root
├── packages/
│   ├── web/                            ← React SPA (Vite)
│   ├── api/                            ← Express.js API server
│   ├── worker/                         ← BullMQ document processing worker
│   └── shared/                         ← Shared TypeScript types + utilities
├── docker/                             ← Docker & Docker Compose configs
├── scripts/                            ← Root-level automation scripts
├── .env.example                        ← Environment variable template
├── .eslintrc.js                        ← Root ESLint config (shared)
├── .prettierrc                         ← Root Prettier config (shared)
├── turbo.json                          ← Turborepo pipeline config
├── package.json                        ← Root package.json (workspaces)
└── README.md
```

---

## 3. Package: `packages/web` (Frontend)

```
packages/web/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatHistoryItem.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── chat/
│   │   │   ├── ChatView.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── AIResponse.tsx
│   │   │   ├── CitationPill.tsx
│   │   │   ├── SearchStatus.tsx
│   │   │   └── ActionButtons.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SuggestionPills.tsx
│   │   │   └── LandingView.tsx
│   │   └── shared/
│   │       ├── Badge.tsx
│   │       ├── Avatar.tsx
│   │       ├── IconButton.tsx
│   │       └── Toast.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── AppPage.tsx
│   ├── hooks/
│   │   ├── useSearch.ts
│   │   ├── useChat.ts
│   │   ├── useUpload.ts
│   │   └── useAuth.ts
│   ├── store/
│   │   └── chatStore.ts              ← Zustand or Context
│   ├── api/
│   │   └── client.ts                 ← Axios instance + API helpers
│   ├── styles/
│   │   ├── tokens.css                ← All CSS custom properties (design tokens)
│   │   └── global.css
│   ├── types/                        ← Local types (or re-export from @knowbase/shared)
│   │   ├── chat.ts
│   │   ├── document.ts
│   │   └── suggestion.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Key Scripts:**
```json
{
  "dev":   "vite",
  "build": "tsc && vite build",
  "test":  "playwright test",
  "lint":  "eslint src --ext ts,tsx"
}
```

---

## 4. Package: `packages/api` (API Server)

```
packages/api/
├── src/
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── upload.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── suggestion.routes.ts
│   │   └── health.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── upload.controller.ts
│   │   ├── chat.controller.ts
│   │   └── suggestion.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── upload.service.ts
│   │   ├── chat.service.ts           ← RAG pipeline (pgvector search)
│   │   ├── suggestion.service.ts
│   │   ├── vectorSearch.service.ts   ← pgvector query helpers
│   │   └── groq.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts        ← JWT verification
│   │   ├── errorHandler.middleware.ts ← Centralized error handler
│   │   ├── rateLimiter.middleware.ts
│   │   └── upload.middleware.ts      ← Multer config
│   ├── db/
│   │   ├── knex.ts                   ← Knex instance
│   │   ├── migrations/
│   │   │   ├── 20260321000000_enable_pgvector.js
│   │   │   ├── 20260321000001_create_users_table.js
│   │   │   ├── 20260321000002_create_documents_table.js
│   │   │   ├── 20260321000003_create_document_embeddings_table.js
│   │   │   ├── 20260321000004_create_suggestions_table.js
│   │   │   ├── 20260321000005_create_chat_sessions_table.js
│   │   │   ├── 20260321000006_create_chat_messages_table.js
│   │   │   └── 20260321000007_create_message_citations_table.js
│   │   └── seeds/
│   │       └── 01_admin_user.js      ← Admin account seeding
│   ├── queue/
│   │   └── documentQueue.ts          ← BullMQ queue setup
│   ├── lib/
│   │   ├── redis.ts                  ← Redis client
│   │   └── logger.ts                 ← Pino/Winston logger
│   ├── validators/
│   │   ├── auth.validator.ts         ← Joi/Zod schemas
│   │   └── chat.validator.ts
│   ├── types/
│   │   └── index.ts                  ← API-local types
│   ├── app.ts                        ← Express app setup
│   └── server.ts                     ← HTTP server entry
├── uploads/                          ← Uploaded files (gitignored)
├── knexfile.js
├── tsconfig.json
└── package.json
```

**Key Scripts:**
```json
{
  "dev":     "ts-node-dev --respawn src/server.ts",
  "build":   "tsc",
  "start":   "node dist/server.js",
  "test":    "jest --coverage",
  "migrate": "knex migrate:latest",
  "seed":    "knex seed:run"
}
```

---

## 5. Package: `packages/worker` (Background Worker)

```
packages/worker/
├── src/
│   ├── processors/
│   │   └── documentProcessor.ts      ← Main BullMQ job handler
│   ├── steps/
│   │   ├── extractText.ts            ← PDF/DOCX/TXT text extraction
│   │   ├── chunkText.ts              ← Fixed-size chunking with overlap
│   │   ├── generateEmbeddings.ts     ← Chunk → embedding vectors
│   │   ├── storeEmbeddings.ts        ← Store vectors in PostgreSQL (pgvector)
│   │   ├── generateSummary.ts        ← Groq LLM: summarize document
│   │   └── generateSuggestions.ts    ← Groq LLM: generate 3 questions
│   ├── lib/
│   │   ├── redis.ts
│   │   ├── db.ts                     ← PostgreSQL connection (Knex)
│   │   └── groq.ts
│   └── worker.ts                     ← BullMQ worker entry point
├── tsconfig.json
└── package.json
```

**Key Scripts:**
```json
{
  "dev":   "ts-node-dev --respawn src/worker.ts",
  "build": "tsc",
  "start": "node dist/worker.js",
  "test":  "jest"
}
```

---

## 6. Package: `packages/shared` (Shared Types)

Shared TypeScript types used by both `web` and `api`.

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── user.ts
│   │   ├── document.ts
│   │   ├── chat.ts
│   │   ├── suggestion.ts
│   │   └── api.ts                    ← Request/response shape types
│   └── index.ts
├── tsconfig.json
└── package.json
```

**Example type exports:**
```ts
// packages/shared/src/types/document.ts
export type DocumentStatus = 'processing' | 'ready' | 'error';
export type FileType = 'pdf' | 'docx' | 'txt';

export interface Document {
  id: string;
  filename: string;
  file_type: FileType;
  file_size: number;
  status: DocumentStatus;
  chunk_count?: number;
  created_at: string;
}
```

---

## 7. Root Configuration

### 7.1 `package.json` (root)

```json
{
  "name": "knowbase",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev":   "turbo run dev",
    "build": "turbo run build",
    "test":  "turbo run test",
    "lint":  "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "typescript": "^5.x"
  }
}
```

### 7.2 `turbo.json` (pipeline)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

---

## 8. Docker Services

```yaml
# docker/docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: knowbase
      POSTGRES_USER: knowbase
      POSTGRES_PASSWORD: knowbase_dev
    ports: ["5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  api:
    build: { context: ../../, dockerfile: docker/Dockerfile.api }
    ports: ["3001:3001"]
    depends_on: [postgres, redis]
    env_file: [../../.env]

  worker:
    build: { context: ../../, dockerfile: docker/Dockerfile.worker }
    depends_on: [redis, postgres]
    env_file: [../../.env]

  web:
    build: { context: ../../, dockerfile: docker/Dockerfile.web }
    ports: ["5173:5173"]
    depends_on: [api]

volumes:
  postgres_data:
```

> **Note:** The Docker image `pgvector/pgvector:pg16` comes with the pgvector extension pre-installed. No separate vector database container is needed.

---

## 9. Dependencies Summary

### Frontend (`packages/web`)

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18 | UI framework |
| `react-dom` | ^18 | DOM rendering |
| `react-router-dom` | ^6 | Client-side routing |
| `zustand` | ^4 | State management |
| `lucide-react` | ^0.3 | Icon library |
| `axios` | ^1 | HTTP client |
| `tailwindcss` | ^3 | Utility CSS |
| `vite` | ^5 | Build tool |
| `@playwright/test` | ^1 | E2E testing |

### Backend (`packages/api`)

| Package | Version | Purpose |
|---|---|---|
| `express` | ^4 | HTTP server |
| `jsonwebtoken` | ^9 | JWT auth |
| `bcrypt` | ^5 | Password hashing |
| `multer` | ^1 | File upload middleware |
| `knex` | ^3 | SQL query builder |
| `pg` | ^8 | PostgreSQL client |
| `pgvector` | ^0.2 | pgvector support for Node.js (optional helper) |
| `ioredis` | ^5 | Redis client |
| `bullmq` | ^5 | Job queue |
| `groq-sdk` | ^0.x | Groq API client |
| `zod` | ^3 | Runtime validation |
| `pino` | ^8 | Structured logging |
| `jest` | ^29 | Unit/integration testing |

### Worker (`packages/worker`)

| Package | Version | Purpose |
|---|---|---|
| `bullmq` | ^5 | Job consumer |
| `pdf-parse` | ^1 | PDF text extraction |
| `mammoth` | ^1 | DOCX text extraction |
| `groq-sdk` | ^0.x | LLM + embedding calls |
| `knex` | ^3 | DB inserts (pgvector via raw SQL) |
| `pg` | ^8 | PostgreSQL client |
| `pgvector` | ^0.2 | pgvector support for Node.js (optional helper) |
| `ioredis` | ^5 | Redis client |

# System Architecture

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026

---

## 1. Architecture Overview

Knowbase is built on a **monorepo, event-driven architecture** with clear separation between the API layer, background processing, and storage layers. Vector embeddings are stored directly in PostgreSQL via the **pgvector** extension, eliminating the need for a separate vector database.

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│               React SPA (Vite + Tailwind + React Router)         │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP / REST
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│               Express.js API Server (Node.js)                    │
│  ┌─────────────┬──────────────────┬──────────────────────────┐  │
│  │ Auth Service│  Upload Service  │  Chat (RAG) Service      │  │
│  │             │                  │  Suggestion Service       │  │
│  └─────────────┴──────────────────┴──────────────────────────┘  │
│               Centralized Error-Handling Middleware               │
└──────────────┬────────────────────────────┬─────────────────────┘
               │ Enqueue Jobs               │ Direct DB Reads
               ▼                            ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐
│    QUEUE LAYER           │    │         STORAGE LAYER            │
│  Redis + BullMQ          │    │  ┌────────────────────────────┐  │
│  - upload-processing     │    │  │ PostgreSQL + pgvector      │  │
│  - suggestion-generation │    │  │ (users, documents,         │  │
└──────────┬───────────────┘    │  │  suggestions, chat_msgs,   │  │
           │ Dequeue            │  │  document_embeddings)      │  │
           ▼                    │  └────────────────────────────┘  │
┌──────────────────────────┐    │  ┌────────────────────────────┐  │
│    WORKER LAYER          │    │  │ Redis                      │  │
│  document-worker.js      │    │  │ (BullMQ queue storage +    │  │
│  ┌─────────────────────┐ │    │  │  suggestion cache)         │  │
│  │ Text Extraction      │ │    │  └────────────────────────────┘  │
│  │ Chunking            │ │    └──────────────────────────────────┘
│  │ Embedding Generation│─┼───►  PostgreSQL (pgvector)
│  │ Summary Generation  │ │
│  │ AI Suggestion Gen   │ │
│  └─────────────────────┘ │
└──────────────────────────┘
           │
           ▼ (calls Groq API)
┌──────────────────────────┐
│   EXTERNAL AI LAYER      │
│   Groq LLM API           │
│   (llama3 / mixtral)     │
└──────────────────────────┘
```

---

## 2. Component Descriptions

### 2.1 Frontend — React SPA

| Property | Value |
|---|---|
| Framework | React 18+ |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| State Management | React Context / Zustand |
| Routing | React Router v6 |
| Icons | Lucide React |
| Fonts | Inter (400/500), JetBrains Mono |
| HTTP Client | Axios / fetch |

**Responsibilities:**
- Render chat interface, sidebar, and upload component
- Stream AI responses token-by-token via SSE or polling
- Manage optimistic UI updates (user message appears instantly)
- Handle auth state (JWT in localStorage or HTTP-only cookie)

### 2.2 API Server — Express.js

**Port:** `3001` (development)

**Middleware Stack:**
1. CORS
2. Rate Limiter
3. JSON Body Parser
4. Auth Middleware (JWT verification)
5. Route Handlers
6. Centralized Error Handler (last middleware)

**Services:**
| Service | Responsibility |
|---|---|
| Auth Service | Register, login, JWT issue/verify |
| Upload Service | Accept file, validate, enqueue BullMQ job |
| Chat Service | Embed query → pgvector search → LLM call → stream response |
| Suggestion Service | Fetch cached suggestions from DB |

### 2.3 Worker Service — Background Processor

Runs as a **separate Node.js process**. Consumes jobs from BullMQ.

**Job: `document-processing`**
1. Text extraction (pdf-parse / mammoth / plain text)
2. Chunking (fixed-size with overlap, ~500 tokens, 50-token overlap)
3. Embedding generation (Groq or local embedding model)
4. Store embeddings in PostgreSQL `document_embeddings` table (pgvector)
5. Generate document summary (Groq LLM)
6. Generate 3 AI suggestions (Groq LLM)
7. Store suggestions in PostgreSQL
8. Update document status to `ready`

**Retry policy:** 3 attempts, exponential backoff.

### 2.4 Redis + BullMQ

- **Role:** Async job queue decoupling API from worker
- **Queue:** `document-processing`
- **Job data:** `{ documentId, filePath, userId }`
- **Also used for:** Suggestion caching (Redis key: `suggestions:{documentId}`)

### 2.5 PostgreSQL + pgvector — Unified Database

PostgreSQL serves as **both** the relational database and the vector store via the pgvector extension, simplifying the infrastructure.

- **Relational data:** `users`, `documents`, `suggestions`, `chat_sessions`, `chat_messages`
- **Vector data:** `document_embeddings` table with a `vector(1536)` column
- **Search:** Cosine distance operator (`<=>`) with IVFFlat or HNSW index for fast similarity queries
- **ORM:** Knex.js (query builder) or Prisma with raw SQL for vector operations

**Advantages of pgvector over a separate vector DB:**
- Single database for all data → simpler deployment, backups, and operations
- Transactional consistency between metadata and vectors
- Fewer services to manage (no separate Qdrant container)
- Still performant for the scale of a personal knowledge base (< millions of vectors)

### 2.6 Groq — External LLM API

- **Role:** Answer generation + suggestion generation
- **Models:** `llama3-8b-8192` (fast, low latency) or `mixtral-8x7b-32768`
- **Use cases:**
  1. RAG query answering (chat service)
  2. Document summary generation (worker)
  3. AI suggestion generation (worker)

---

## 3. Detailed Data Flows

### 3.1 Upload & Processing Pipeline

```
1.  User selects file → POST /api/upload
2.  API validates: file type, size (max 10MB)
3.  File saved to disk (or object storage)
4.  Document record inserted: PostgreSQL (status: 'processing')
5.  Job enqueued: BullMQ queue 'document-processing'
6.  API responds: 202 Accepted { documentId }
7.  Worker picks up job:
    a. Extract text from file
    b. Split text into chunks (~500 tokens, 50-token overlap)
    c. Generate embedding for each chunk (Groq/embedding model)
    d. Insert each embedding into document_embeddings table (pgvector)
    e. Generate document summary (Groq LLM)
    f. Generate 3 suggested questions (Groq LLM: "List 3 useful questions...")
    g. Store suggestions in PostgreSQL
    h. Update document status: 'ready'
8.  Frontend polls GET /api/documents/:id/status
9.  On status = 'ready': show ✓ + display suggestions
```

### 3.2 RAG Query Pipeline

```
1.  User types query → POST /api/chat
2.  Auth middleware verifies JWT
3.  Chat service:
    a. Convert query to embedding (Groq embedding model)
    b. Vector search in PostgreSQL using pgvector:
       SELECT * FROM document_embeddings
       WHERE user_id = $1
       ORDER BY embedding <=> $2    -- cosine distance
       LIMIT 5
    c. Format chunks as context block
    d. Build LLM prompt:
       "Answer only from the context below. If the answer is not in the context,
       say 'I don't have information on that in your documents.'
       Context: {chunks}
       Question: {query}"
    e. Stream response from Groq API → SSE to frontend
    f. After response: save chat_message to PostgreSQL
    g. Return citation metadata (documentId, chunkIndex, filename, page)
4.  Frontend renders streaming response + citation pills
```

### 3.3 Suggestion Retrieval Flow

```
1.  Frontend loads page → GET /api/suggestions
2.  API checks Redis cache: key = 'suggestions:{userId}'
3.  Cache hit: return suggestions from Redis
4.  Cache miss: query PostgreSQL suggestions table
5.  Set Redis cache (TTL: 24h)
6.  Return suggestions to frontend
7.  Frontend renders suggestion pills below search bar
```

---

## 4. Service-to-Service Communication

| From | To | Protocol | Notes |
|---|---|---|---|
| Frontend | API Server | HTTP/REST | JSON responses; SSE for streaming |
| API Server | Redis | TCP | BullMQ job enqueue |
| API Server | PostgreSQL | TCP | Direct SQL queries + pgvector searches |
| API Server | Groq | HTTPS | External REST API |
| Worker | Redis | TCP | BullMQ job dequeue |
| Worker | PostgreSQL | TCP | Store embeddings (pgvector), update status, store suggestions |
| Worker | Groq | HTTPS | LLM inference |

---

## 5. Scalability Design

| Concern | Solution |
|---|---|
| API scalability | Stateless Express server → horizontal scaling behind load balancer |
| Worker scalability | Multiple worker processes consuming same BullMQ queue |
| Vector search perf | pgvector HNSW index for fast ANN queries; partitioning by user_id if needed |
| DB bottleneck | PostgreSQL with read replicas (post-MVP); connection pooling via pgBouncer |
| Suggestion recompute | Cache suggestions in Redis → avoid re-calling Groq on every page load |
| LLM latency | Groq API optimized for low-latency inference; SSE streaming hides latency |

---

## 6. Failure Handling

| Failure | Handling |
|---|---|
| Worker job fails | BullMQ retries (max 3, exponential backoff) |
| Groq API timeout | Retry once; return fallback message after 2 failures |
| PostgreSQL unreachable | Return 503 with "Search unavailable, try again shortly" |
| Suggestion generation fails | Use fallback static suggestions; log failure |
| Upload file too large | Reject at API layer before saving to disk |
| No chunks found for query | Return: "No relevant results in your documents." |

---

## 7. Security Considerations

- All API routes protected by JWT middleware (except `/auth/*`)
- File type validation: MIME type + extension whitelist (PDF, DOCX, TXT)
- File size limit enforced at API layer (before disk write)
- Sanitize filenames before storage (path traversal prevention)
- Centralized error handler: never expose stack traces to client
- Rate limiting on auth endpoints to prevent brute force
- Environment variables for all secrets (Groq API key, DB credentials, JWT secret)

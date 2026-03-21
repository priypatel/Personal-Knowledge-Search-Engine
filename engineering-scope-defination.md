# Engineering Scope Definition

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026

---

## 1. Purpose

This document defines the **precise engineering boundary** for the MVP milestone. It explicitly states what IS in scope, what is NOT in scope, what the mandatory engineering standards are, and what constitutes a definition of done.

---

## 2. What Is In Scope (MVP)

### 2.1 Core Functions

| # | Feature | Package | Priority |
|---|---|---|---|
| 1 | User registration + JWT authentication | `api` | P0 |
| 2 | Admin account seeding via migration (no UI creation) | `api` | P0 |
| 3 | File upload (PDF, DOCX, TXT — max 10MB) | `api`, `worker` | P0 |
| 4 | Background document processing pipeline (extract → chunk → embed → store in pgvector) | `worker` | P0 |
| 5 | Semantic vector search via pgvector (PostgreSQL) | `api` | P0 |
| 6 | RAG answer generation via Groq (document-grounded only) | `api` | P0 |
| 7 | Source citations on every AI response | `api`, `web` | P0 |
| 8 | Chat session persistence (messages, citations in PostgreSQL) | `api` | P0 |
| 9 | Chat history sidebar (date-grouped) | `web` | P0 |
| 10 | AI-generated suggestions per document (cached) | `worker`, `api`, `web` | P1 |
| 11 | Suggestion pills UI on landing page | `web` | P1 |
| 12 | Source detail panel (citation click → chunk viewer) | `web` | P1 |
| 13 | Upload progress and status in chat UI | `web` | P0 |
| 14 | Responsive UI (≥768px → 1024px+) | `web` | P1 |
| 15 | Centralized error handling middleware | `api` | P0 |
| 16 | Input validation on all routes (Zod/Joi) | `api` | P0 |
| 17 | Structured logging (Pino) | `api`, `worker` | P0 |
| 18 | BullMQ job retry on failure (max 3) | `worker` | P0 |
| 19 | Suggestion Redis caching | `api` | P1 |
| 20 | Health check endpoint | `api` | P0 |

---

## 3. What Is Out of Scope (MVP)

The following features will **NOT** be built in the MVP. They are planned for post-MVP.

| Feature | Reason |
|---|---|
| Multi-tenant / team workspaces | Adds significant auth + data isolation complexity |
| Document management UI (delete, re-process) | Nice-to-have; manual deletion via API is sufficient for MVP |
| Mobile native apps (iOS/Android) | Web-first, desktop-primary for MVP |
| Google Drive / Notion / Dropbox integrations | Third-party OAuth + sync complexity |
| Real-time collaborative chat | WebSocket infra not planned |
| Multi-LLM support (OpenAI, Anthropic, etc.) | Groq-only for MVP; abstraction layer in post-MVP |
| Email verification | Simple registration flow for MVP |
| Password reset / forgot password flow | Out of scope for now |
| Full admin dashboard | Admin role seeded; no admin UI in MVP |
| Re-process document (re-chunk/re-embed) | Post-MVP; delete + re-upload is workaround |
| Document sharing between users | Single-user only in MVP |
| Export/download chat history | Post-MVP |
| Analytics and dashboards | Post-MVP |
| General AI mode (non-RAG answers) | Explicitly excluded by product requirements |
| Separate vector database (Qdrant, Pinecone, etc.) | Using pgvector within PostgreSQL for simplicity |

---

## 4. Mandatory Engineering Standards

Every feature shipped must comply with these non-negotiable engineering rules:

### 4.1 Validation

- **All API inputs validated** using Zod or Joi schemas before processing
- File uploads: validate MIME type AND file extension (both must match allowlist)
- No raw query/parameter values passed to DB or LLM without sanitization
- Frontend: use Formik + Yup for all form inputs (login, register)

### 4.2 Error Handling

- **Centralized error handler** in Express: all thrown errors flow to single middleware
- Never expose stack traces or internal error messages to frontend
- All background job failures must update document status in DB to `'error'`
- PostgreSQL/pgvector failures must return appropriate 503 responses with `code` field
- Frontend must handle and display every error state documented in UIDesign.md

### 4.3 Logging

- Structured JSON logging via Pino on API and worker
- Log levels: `debug` (dev), `info` (production default)
- Required log events:
  - Request received (method, path, userId)
  - Job enqueued (documentId, userId)
  - Job started / completed / failed (with reason)
  - LLM call sent / response received (token count, latency)
  - pgvector search performed (query, topK, results count, latency)
  - Auth events (login success/fail, registration)

### 4.4 Testing (Mandatory for Every Feature)

> **Rule:** No feature ships without tests. PR blocked if coverage drops below 80%.

| Layer | Tool | Required For |
|---|---|---|
| Unit | Jest | All utility functions, services, chunking logic, embedding, scoring |
| Integration | Jest (supertest) | All API endpoints (happy path + error cases) |
| E2E | Playwright | All core user flows (see test scenarios below) |

**Playwright E2E scenarios (must all pass):**
1. Register new user → log in → see empty state
2. Log in as existing user → upload PDF → wait for processing → see suggestions
3. Click suggestion → verify chat response + citations appear
4. Type custom query → verify response + citations
5. Click citation pill → verify source detail panel opens with correct chunk
6. Upload invalid file type → verify error message
7. Upload file > 10MB → verify rejection message
8. No documents uploaded → send query → verify "no documents" message

### 4.5 CI/CD Rules

- All commits trigger: lint → unit tests → integration tests → build
- All PRs to `main` must also pass Playwright E2E tests
- Any test failure blocks merge to `main`
- No `.env` files committed — use `.env.example` as template
- Database migrations run automatically on deployment

### 4.6 Security

- JWT stored in HTTP-only cookie (preferred) or localStorage
- Passwords hashed with bcrypt (min 10 salt rounds)
- All routes except `/api/auth/*` and `/api/health` protected by auth middleware
- Admin routes additionally check `req.user.role === 'admin'`
- Filenames sanitized before disk write (no path traversal: strip `../`, special chars)
- Rate limiting on auth endpoints (max 10 requests/min per IP)
- CORS configured explicitly (not open `*`) in production

### 4.7 Performance

| Operation | Target Latency | Measurement |
|---|---|---|
| Query response (full RAG) | < 3 seconds | P95 from request → first token |
| Document processing (10MB PDF) | < 30 seconds | Job start → status = 'ready' |
| pgvector similarity search | < 200ms | SQL query time (with HNSW index) |
| Suggestion retrieval (cache hit) | < 100ms | Redis read |
| Suggestion retrieval (DB miss) | < 500ms | PostgreSQL query |
| Page load (initial) | < 2 seconds | Lighthouse FCP |

---

## 5. Technical Constraints

| Constraint | Value | Rationale |
|---|---|---|
| Max file size | 10MB | Cost/performance of embedding pipeline |
| Supported file types | PDF, DOCX, TXT | Main personal document formats |
| LLM Provider | Groq only | Fast inference, generous free tier |
| Vector storage | pgvector (PostgreSQL extension) | Simplifies infrastructure; single DB for all data |
| Top-K chunks | 5 (default), max 10 | Balance between context quality and LLM cost |
| Suggestion count | 3 per document | LLM prompt constraints |
| Context window budget | 6,000 tokens | Fits within Groq model limits with room for answer |
| Min chunk size | 100 tokens | Ensures meaningful semantic units |
| Chunk size | ~500 tokens | Standard RAG best practice |
| HNSW index | m=16, ef_construction=64 | Good default for < 500K vectors |

---

## 6. Definition of Done (DoD)

A feature is considered **done** when:

- [ ] Code is written and follows TypeScript strict mode
- [ ] Input validation is implemented (Zod/Joi on API; Yup on frontend)
- [ ] Error handling covers all known failure modes
- [ ] Structured logs emitted for all significant events
- [ ] Unit tests written (≥80% coverage on new code)
- [ ] Integration tests written for API endpoints
- [ ] E2E Playwright test covers the happy path
- [ ] No linting errors (`eslint --max-warnings 0`)
- [ ] PR reviewed and approved by at least 1 other engineer
- [ ] Feature works in local Docker Compose environment
- [ ] Feature is documented in relevant API contract or architecture doc (if applicable)

---

## 7. Engineering Team Conventions

| Convention | Rule |
|---|---|
| Branching | `feature/<feature-name>` branches off `main` |
| Commit messages | Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:` |
| PR size | Max 400 lines of code changed per PR |
| Code review | 1 approval required; no self-merge to `main` |
| Environment secrets | Never hardcoded; always in `.env` |
| TypeScript | Strict mode enabled; no `any` except explicit escape hatches with comment |
| Database access | Go through service layer; no direct DB calls in route handlers |
| LLM calls | Centralized in `groq.service.ts`; no raw API calls elsewhere |
| Vector search | Centralized in `vectorSearch.service.ts`; no raw pgvector SQL scattered around codebase |

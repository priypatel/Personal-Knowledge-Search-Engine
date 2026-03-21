# Development Phases

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026

---

## Phase Overview

```
Phase 0: Foundation & Tooling      (Week 1)
Phase 1: Core Backend Pipeline     (Week 2–3)
Phase 2: RAG Query Engine          (Week 4)
Phase 3: Frontend — Core UI        (Week 5–6)
Phase 4: AI Suggestions (Level 3)  (Week 7)
Phase 5: Auth & Security           (Week 3 — parallel with backend)
Phase 6: Testing & QA              (Week 7–8)
Phase 7: Deployment & Launch Prep  (Week 8)
```

> Note: Auth (Phase 5) runs in parallel with Phase 1 for efficiency. All other phases are sequential dependencies.

---

## Phase 0: Foundation & Tooling
**Duration:** 3–4 days (Week 1)
**Goal:** Establish the monorepo, developer environment, and baseline infrastructure.

### Deliverables

| Task | Owner Package | Notes |
|---|---|---|
| Initialize monorepo (Turborepo + npm workspaces) | root | `packages/web`, `api`, `worker`, `shared` |
| Configure TypeScript (strict) for all packages | all | Shared `tsconfig.base.json` |
| Set up ESLint + Prettier at root | root | Shared config extended per package |
| Configure Docker Compose | docker/ | pgvector/pgvector:pg16, redis, api, worker, web |
| Create `.env.example` with all required variables | root | |
| Initialize Knex + migration runner | `api` | Create first migration (empty) |
| Initialize Vite + React project in `web` | `web` | |
| Install all dependencies (see monorepo-architecture.md) | all | |
| Create Git repository, set up `main` branch protection | git | Require PR + passing CI |
| Set up GitHub Actions CI pipeline (lint + test + build) | .github/ | |

### Completion Criteria
- [ ] `npm run dev` from root starts all 3 services (api, worker, web)
- [ ] Docker Compose brings up postgres (with pgvector), redis successfully
- [ ] GitHub CI runs and passes on push to any branch
- [ ] All environment variables documented in `.env.example`

---

## Phase 1: Core Backend Pipeline
**Duration:** 7–10 days (Week 2–3)
**Goal:** Full end-to-end document processing pipeline working.

### Deliverables

#### 1A: Upload Service
| Task | Package |
|---|---|
| `POST /api/upload` endpoint with Multer | `api` |
| File type validation (PDF, DOCX, TXT) | `api` |
| File size validation (max 10MB) | `api` |
| Save file to disk under `uploads/{userId}/{documentId}/` | `api` |
| Insert document record to PostgreSQL (status: 'processing') | `api` |
| Enqueue BullMQ job: `document-processing` | `api` |
| Return 202 Accepted with documentId | `api` |

#### 1B: Database Migrations
| Task | Package |
|---|---|
| Migration: `create_users_table` | `api` |
| Migration: `create_documents_table` | `api` |
| Migration: `create_suggestions_table` | `api` |
| Migration: `create_chat_sessions_table` | `api` |
| Migration: `create_chat_messages_table` | `api` |
| Migration: `create_message_citations_table` | `api` |
| Seed: Admin user creation | `api` |

#### 1C: Document Processing Worker
| Task | Package |
|---|---|
| BullMQ worker setup consuming `document-processing` queue | `worker` |
| PDF text extraction (pdf-parse) | `worker` |
| DOCX text extraction (mammoth) | `worker` |
| TXT text extraction (native fs.readFile) | `worker` |
| Text chunking: 500-token, 50-token overlap, sentence-aware | `worker` |
| Embedding generation per chunk via Groq | `worker` |
| Store embeddings in PostgreSQL `document_embeddings` table (pgvector) | `worker` |
| Update document status to 'ready' or 'error' | `worker` |
| BullMQ retry policy: 3 attempts, exponential backoff | `worker` |

#### 1D: Document Status API
| Task | Package |
|---|---|
| `GET /api/documents` — list user's documents | `api` |
| `GET /api/documents/:id/status` — poll processing status | `api` |
| `DELETE /api/documents/:id` — delete + cascade embeddings | `api` |

### Completion Criteria
- [ ] Upload a PDF → worker processes it → status changes to 'ready'
- [ ] Chunks stored in `document_embeddings` table with correct user_id
- [ ] Failed job retried 3 times then marked 'error' in DB
- [ ] Unit tests for chunking logic pass (>= 80% coverage)
- [ ] Integration test for upload endpoint passes

---

## Phase 2: RAG Query Engine
**Duration:** 5–7 days (Week 4)
**Goal:** Full RAG pipeline working: query → vector search → LLM → response + citations.

### Deliverables

| Task | Package |
|---|---|
| Query embedding via Groq | `api` |
| pgvector search: top-5, cosine distance, user-scoped filter | `api` |
| Relevance scoring + re-ranking (cosine + recency boost) | `api` |
| Context assembly (≤6,000 tokens, labeled chunks) | `api` |
| Groq LLM prompt construction (strict RAG mode) | `api` |
| SSE streaming response to frontend | `api` |
| Save chat session + messages to PostgreSQL | `api` |
| Save citations (message_citations table) | `api` |
| `POST /api/chat` endpoint | `api` |
| `GET /api/chat/sessions` endpoint | `api` |
| `GET /api/chat/sessions/:id` endpoint | `api` |
| `GET /api/chunks/:chunkId` endpoint (for citation panel) | `api` |
| "No documents" fallback (skip LLM, return message) | `api` |
| "No relevant results" fallback (0 chunks pass threshold) | `api` |

### Completion Criteria
- [ ] Ask a question about an uploaded PDF → get a grounded answer
- [ ] Response includes citation metadata with document name + chunk
- [ ] Empty document library → "No documents found" response (no LLM call)
- [ ] No chunk passes score threshold → returns fallback message (no LLM call)
- [ ] Unit tests for scoring and context assembly
- [ ] Integration test for `/api/chat` endpoint

---

## Phase 3: Frontend — Core UI
**Duration:** 8–10 days (Week 5–6)
**Goal:** Full working UI: landing, chat, sidebar, upload, citations.

### Deliverables

#### 3A: Design System & Tokens
| Task |
|---|
| Implement `styles/tokens.css` with all CSS custom properties from UIDesign.md |
| Configure Tailwind with token extensions |
| Add Inter + JetBrains Mono from Google Fonts |

#### 3B: Layout Shell
| Task |
|---|
| App shell: sidebar (260px fixed) + main content (flex-grow) |
| Responsive: sidebar collapses to icon-only at 768–1023px |
| Responsive: sidebar becomes slide-over drawer at <768px |

#### 3C: Sidebar Components
| Task |
|---|
| `Sidebar.tsx` — full sidebar layout |
| `ChatHistoryItem.tsx` — with date-group labels (TODAY, YESTERDAY, THIS WEEK) |
| `DocumentList.tsx` — file type badges, processing status |
| `UserProfile.tsx` — avatar (initials), user name |
| `New Chat` button with Ctrl+N keyboard shortcut |

#### 3D: Landing Screen
| Task |
|---|
| `LandingView.tsx` — centered brand icon, heading, subtitle |
| `SearchBar.tsx` — upload button, file type pills, send button, keyboard shortcuts |
| `SuggestionPills.tsx` — placeholder while no documents |

#### 3E: Chat View Screen
| Task |
|---|
| `ChatView.tsx` — full-height flex column |
| `ChatHeader.tsx` — title + source count badge |
| `MessageBubble.tsx` — user bubble (right-aligned, primary blue) |
| `AIResponse.tsx` — left-aligned, no bubble, streaming |
| `SearchStatus.tsx` — animated search indicator above AI response |
| `CitationPill.tsx` — blue vs. teal color logic |
| `ActionButtons.tsx` — Copy, View Sources |
| `FileAttachmentIndicator.tsx` — shows uploaded file in chat |

#### 3F: Source Detail Panel
| Task |
|---|
| `SourceDetailPanel.tsx` — slide-in from right (250ms ease-out) |
| Full chunk text + document name + page ref |
| Previous/next navigation |
| Relevance score indicator |
| Dismiss on Esc or close button |

#### 3G: Shared Components
| Task |
|---|
| `Toast.tsx` — top-right auto-dismiss (5s) |
| `Badge.tsx` — file type badges |
| `Avatar.tsx` — initials circle |
| `IconButton.tsx` — standardized icon button |
| Skeleton loading states (pulsing blocks for AI response) |

#### 3H: API Integration
| Task |
|---|
| `api/client.ts` — Axios instance with JWT header injection |
| `useUpload.ts` hook — upload + status polling |
| `useChat.ts` hook — send query, SSE streaming, citation handling |
| `useSearch.ts` hook — search bar state |
| Error state handling for all UI error cases in UIDesign.md |

### Completion Criteria
- [ ] Full user flow works end-to-end in browser (upload → suggestions → query → citations)
- [ ] All keyboard shortcuts work (/, Ctrl+N, Ctrl+K, Enter, Shift+Enter, Esc)
- [ ] Error states display correctly (upload fail, no results, network error)
- [ ] Empty states display correctly (no chats, no documents, no results)
- [ ] Responsive layout works at 768px, 1024px, 1440px

---

## Phase 4: AI Suggestions (Level 3)
**Duration:** 3–4 days (Week 7)
**Goal:** Document summary + 3 AI suggestions generated per upload, cached and displayed.

### Deliverables

| Task | Package |
|---|---|
| Document summary generation (Groq) in worker pipeline | `worker` |
| Suggestion generation: 3 questions per document (Groq) | `worker` |
| Store suggestions in PostgreSQL | `worker` |
| Cache suggestions in Redis (TTL 24h) | `api` |
| `GET /api/suggestions` endpoint (with Redis cache logic) | `api` |
| Update `SuggestionPills.tsx` to show real suggestions after upload | `web` |
| Suggestion click → auto-populate + auto-send query | `web` |
| Fallback static suggestions when generation fails | `worker` |

### Completion Criteria
- [ ] Upload a document → 3 real suggestions appear below search bar
- [ ] Suggestions are document-specific and contextually relevant
- [ ] Second page load (cache hit): suggestions load < 100ms
- [ ] Worker suggestion failure: static fallbacks shown, no UI error

---

## Phase 5: Authentication & Security (Parallel with Phase 1)
**Duration:** 4–5 days (Week 3)
**Goal:** User registration, login, JWT auth, protected routes.

### Deliverables

| Task | Package |
|---|---|
| `POST /api/auth/register` — email + password registration | `api` |
| `POST /api/auth/login` — JWT issuance | `api` |
| `auth.middleware.ts` — JWT verification on protected routes | `api` |
| Role-based access: `user` vs `admin` | `api` |
| Admin user seed: `seeds/01_admin_user.js` | `api` |
| Rate limiter on auth routes (10/min) | `api` |
| `LoginPage.tsx` — Formik + Yup form | `web` |
| `RegisterPage.tsx` — Formik + Yup form | `web` |
| Auth context + `useAuth.ts` hook | `web` |
| Protected route wrapper: redirect `/login` if unauthenticated | `web` |

### Completion Criteria
- [ ] Register a new user → redirected to app
- [ ] Login with wrong password → generic error message
- [ ] Unauthenticated request to protected API route → 401
- [ ] Admin user exists after `knex seed:run`
- [ ] Admin user cannot be created via UI

---

## Phase 6: Testing & QA
**Duration:** 5–7 days (Week 7–8)
**Goal:** Full test suite passing. Coverage ≥ 80%.

### Deliverables

| Task | Package |
|---|---|
| Unit tests: chunking logic | `worker` |
| Unit tests: embedding generation | `worker` |
| Unit tests: scoring + re-ranking algorithm | `api` |
| Unit tests: context assembly | `api` |
| Unit tests: suggestion generation | `worker` |
| Integration tests: `POST /api/auth/register` | `api` |
| Integration tests: `POST /api/auth/login` | `api` |
| Integration tests: `POST /api/upload` | `api` |
| Integration tests: `POST /api/chat` | `api` |
| Integration tests: `GET /api/suggestions` | `api` |
| Playwright E2E: all 8 scenarios from engineering-scope-defination.md | `web` |
| Jest coverage report — assert ≥ 80% | all |

### Completion Criteria
- [ ] All 8 Playwright E2E scenarios pass
- [ ] Jest unit + integration coverage ≥ 80%
- [ ] No linting errors (`eslint --max-warnings 0`)
- [ ] CI pipeline green on `main` branch

---

## Phase 7: Deployment & Launch Prep
**Duration:** 3–4 days (Week 8)
**Goal:** Deploy to production environment. Documentation complete.

### Deliverables

| Task |
|---|
| Deploy PostgreSQL (managed: Railway / Neon / Supabase) |
| Verify pgvector extension is supported on production PostgreSQL provider |
| Deploy Redis (managed: Upstash or Railway Redis) |
| Deploy API server (Railway / Fly.io / Render) |
| Deploy Worker service (same platform as API or separate) |
| Deploy Frontend (Vercel / Netlify) |
| Set all production environment variables in deploy platform |
| Run `knex migrate:latest` on production DB |
| Run `knex seed:run` for admin user on production DB |
| Verify health check endpoint returns 200 on production |
| Smoke test all 8 Playwright scenarios against production URL |
| Final README.md update: setup, run, deploy instructions |

### Completion Criteria
- [ ] Production URL accessible and fully functional
- [ ] All environment variables properly set (no using dev secrets in prod)
- [ ] Health check at `/api/health` returns `status: ok` in production
- [ ] All 8 E2E scenarios pass against production URL

---

## Timeline Summary

| Phase | Duration | Week |
|---|---|---|
| Phase 0: Foundation | ~4 days | Week 1 |
| Phase 1: Backend Pipeline | ~8 days | Week 2–3 |
| Phase 5: Auth (parallel) | ~5 days | Week 3 |
| Phase 2: RAG Engine | ~6 days | Week 4 |
| Phase 3: Frontend UI | ~9 days | Week 5–6 |
| Phase 4: AI Suggestions | ~4 days | Week 7 |
| Phase 6: Testing | ~6 days | Week 7–8 |
| Phase 7: Deployment | ~4 days | Week 8 |
| **Total** | **~46 dev-days** | **~8 weeks** |

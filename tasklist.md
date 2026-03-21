# Task List — Knowbase MVP

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026
**Format:** Ordered by development phase, checkable when complete.

---

## Phase 0: Foundation & Tooling

### Monorepo Setup
- [ ] Initialize git repository with `main` branch
- [ ] Set up Turborepo + npm workspaces at root
- [ ] Create `packages/` directory with `web/`, `api/`, `worker/`, `shared/` sub-packages
- [ ] Configure root `package.json` with workspace definitions and shared scripts
- [ ] Configure `turbo.json` pipeline (dev, build, test, lint)

### TypeScript & Tooling
- [ ] Create `tsconfig.base.json` at root (strict mode)
- [ ] Extend `tsconfig.base.json` in each package
- [ ] Set up ESLint with TypeScript plugin at root (shared config)
- [ ] Set up Prettier at root (shared config)
- [ ] Add `.eslintignore` and `.prettierignore` files

### Environment
- [ ] Create `.env.example` with all variables documented (see envierment.md)
- [ ] Add `.env.local`, `.env.test`, `uploads/` to `.gitignore`
- [ ] Create `docker/docker-compose.yml` with `pgvector/pgvector:pg16` (PostgreSQL + pgvector), redis, api, worker, web services
- [ ] Verify Docker Compose: `docker compose up postgres redis -d` works

### CI/CD
- [ ] Create `.github/workflows/ci.yml` (lint + unit/integration tests + E2E)
- [ ] Add branch protection to `main` (require PR + passing CI)

### Shared Package
- [ ] Initialize `packages/shared` package
- [ ] Create shared types: `user.ts`, `document.ts`, `chat.ts`, `suggestion.ts`, `api.ts`
- [ ] Export all types from `packages/shared/src/index.ts`

---

## Phase 5: Authentication (Parallel with Phase 1)

### Backend — Auth
- [ ] Create `users` table migration
- [ ] Build `POST /api/auth/register` endpoint
  - [ ] Validate: email format, password ≥ 8 chars
  - [ ] Hash password with bcrypt (10 rounds)
  - [ ] Return 409 if email already exists
  - [ ] Issue JWT on success
- [ ] Build `POST /api/auth/login` endpoint
  - [ ] Compare bcrypt hash
  - [ ] Return 401 on mismatch (generic message only)
  - [ ] Issue JWT on success
- [ ] Create `auth.middleware.ts` for JWT verification
  - [ ] Attach `req.user` on success
  - [ ] Return 401 if token missing or invalid
- [ ] Create admin seed script `seeds/01_admin_user.js`
  - [ ] Seeds admin from `ADMIN_EMAIL`, `ADMIN_PASSWORD` env vars
  - [ ] Verify admin cannot be created via UI
- [ ] Add rate limiting on auth routes (10/min per IP)

### Frontend — Auth
- [ ] Create `LoginPage.tsx` with Formik + Yup validation
- [ ] Create `RegisterPage.tsx` with Formik + Yup validation
- [ ] Create `useAuth.ts` hook (login, register, logout, user state)
- [ ] Create `<ProtectedRoute>` wrapper component
- [ ] Add React Router routes: `/login`, `/register`, `/*` (protected)
- [ ] Store JWT in localStorage (or HTTP-only cookie)
- [ ] Auto-redirect to `/login` on 401 API response

### Auth Tests
- [ ] Unit: `authService.test.ts` (hash, JWT issue, JWT verify)
- [ ] Integration: register + login scenarios (see testing.strategy.md)

---

## Phase 1: Core Backend Pipeline

### Database Migrations
- [ ] Migration: `enable_pgvector` extension (`CREATE EXTENSION IF NOT EXISTS vector`)
- [ ] Migration: `create_users_table`
- [ ] Migration: `create_documents_table`
- [ ] Migration: `create_document_embeddings_table` (with `vector(1536)` column + HNSW index)
- [ ] Migration: `create_suggestions_table`
- [ ] Migration: `create_chat_sessions_table`
- [ ] Migration: `create_chat_messages_table`
- [ ] Migration: `create_message_citations_table`
- [ ] Verify all migrations run cleanly: `npx knex migrate:latest`
- [ ] Verify rollback works: `npx knex migrate:rollback`

### Upload API
- [ ] Install and configure Multer middleware
- [ ] Create `POST /api/upload` route
  - [ ] Validate MIME type + file extension (PDF/DOCX/TXT allowlist)
  - [ ] Validate file size ≤ 10MB
  - [ ] Save file to `uploads/{userId}/{documentId}/{filename}`
  - [ ] Sanitize filename (no path traversal)
  - [ ] Insert document record in PostgreSQL (status: 'processing')
  - [ ] Enqueue BullMQ job with `{ documentId, filePath, userId }`
  - [ ] Return 202 Accepted with `{ documentId }`
- [ ] Create `GET /api/documents` (list user's documents)
- [ ] Create `GET /api/documents/:id/status` (poll status)
- [ ] Create `DELETE /api/documents/:id` (delete + cascade embeddings)

### Document Processing Worker
- [ ] Initialize BullMQ worker consuming `document-processing` queue
- [ ] Implement `extractText.ts`:
  - [ ] PDF extraction (pdf-parse)
  - [ ] DOCX extraction (mammoth)
  - [ ] TXT extraction (native fs.readFile)
- [ ] Implement `chunkText.ts`:
  - [ ] ~500 token chunks with 50-token overlap
  - [ ] Sentence-aware splitting
  - [ ] Discard chunks < 100 tokens
- [ ] Implement `generateEmbeddings.ts`:
  - [ ] Call Groq embedding endpoint per chunk
  - [ ] Return 1536-dimension float32 vectors
  - [ ] Retry once on timeout
- [ ] Implement `storeEmbeddings.ts`:
  - [ ] INSERT each chunk into `document_embeddings` table (pgvector)
  - [ ] Include full payload: document_id, user_id, chunk_index, chunk_text, filename, page_ref
- [ ] Update document status to 'ready' on completion
- [ ] Update document status to 'error' + `error_msg` on failure
- [ ] Configure retry: 3 attempts, exponential backoff

### Worker Tests
- [ ] Unit: `chunkText.test.ts` (sizes, overlap, edge cases)
- [ ] Unit: `extractText.test.ts` (PDF/DOCX/TXT output)
- [ ] Unit: `generateEmbeddings.test.ts` (mock Groq, return shape)

### Upload Integration Tests
- [ ] Integration: `POST /api/upload` (valid + invalid file types, size limit)
- [ ] Integration: `GET /api/documents` (user scoping)
- [ ] Integration: `GET /api/documents/:id/status`

---

## Phase 2: RAG Query Engine

### Query & Retrieval
- [ ] Implement query embedding generation (Groq)
- [ ] Implement pgvector search service (`vectorSearch.service.ts`):
  - [ ] Cosine distance query using `<=>` operator
  - [ ] `user_id` filter on every search (user-scoped)
  - [ ] Score threshold: 0.70 (cosine similarity)
  - [ ] Top-K: 5 (configurable)
- [ ] Implement relevance scoring + re-ranking:
  - [ ] Composite score = 0.8 × cosine + 0.2 × recency
  - [ ] De-duplication of near-duplicate chunks
- [ ] Implement context assembly:
  - [ ] Label each chunk: `[Source N: filename, page_ref]`
  - [ ] Enforce max 6,000 token context window
  - [ ] Truncate lowest-scoring chunks if over limit

### LLM & Response
- [ ] Create Groq chat service (strict RAG prompt template)
- [ ] Implement SSE streaming response from Groq → frontend
- [ ] Handle "no documents" case (return 400, skip LLM)
- [ ] Handle "no chunks pass threshold" case (fallback message, skip LLM)

### Chat Session Management
- [ ] Create `POST /api/chat` endpoint
- [ ] Create `GET /api/chat/sessions` endpoint
- [ ] Create `GET /api/chat/sessions/:id` endpoint
- [ ] Create `DELETE /api/chat/sessions/:id` endpoint
- [ ] Create `GET /api/chunks/:embeddingId` endpoint (for citation panel)
- [ ] Save chat messages and citations to PostgreSQL after each response

### Chat Tests
- [ ] Unit: `chatService.test.ts` (scoring, context assembly, prompt format)
- [ ] Unit: `vectorSearch.test.ts` (pgvector query formation, filtering)
- [ ] Integration: `POST /api/chat` (happy path, no-docs, no-results)
- [ ] Integration: `GET /api/chat/sessions`

---

## Phase 3: Frontend — Core UI

### Design System
- [ ] Implement `styles/tokens.css` (all CSS custom properties from UIDesign.md)
- [ ] Configure Tailwind with token extensions
- [ ] Add Inter + JetBrains Mono from Google Fonts
- [ ] Verify dark mode token values are set

### App Shell & Layout
- [ ] Create `App.tsx` with provider wrappers
- [ ] Create `router.tsx` with all routes
- [ ] Create `ProtectedLayout.tsx` (sidebar + main content area)
- [ ] Implement sidebar: 260px fixed, scrollable content
- [ ] Implement responsive breakpoints (768px, 1024px+)

### Sidebar Components
- [ ] `Sidebar.tsx` (full container)
- [ ] `SidebarHeader.tsx` (brand logo + new chat button)
- [ ] `ChatHistoryItem.tsx` (title + source count badge, states)
- [ ] `ChatHistoryList.tsx` (date-grouped: TODAY/YESTERDAY/THIS WEEK)
- [ ] `DocumentList.tsx` (filename + file type badge + status)
- [ ] `UserProfile.tsx` (avatar initials + user name)

### Landing Screen (`/`)
- [ ] `LandingView.tsx` (centered layout)
- [ ] Brand icon (48px SVG)
- [ ] Heading: "What do you want to know?"
- [ ] Subtitle text
- [ ] `SearchBar.tsx` (upload button, file type pills, send button)
- [ ] `SuggestionPills.tsx` (static placeholders initially)
- [ ] Keyboard hint at bottom: "Press / to focus search"

### Chat Screen (`/chat/:chatId`)
- [ ] `ChatView.tsx` (full-height flex column)
- [ ] `ChatHeader.tsx` (title + source count badge)
- [ ] `MessageBubble.tsx` (user message, right-aligned, primary blue)
- [ ] `FileAttachmentIndicator.tsx` (below user bubble on upload)
- [ ] `SearchStatus.tsx` (animated, "Searching X documents...")
- [ ] `AIResponse.tsx` (left-aligned, no bubble, token streaming)
- [ ] `CitationPill.tsx` (blue vs. teal color logic)
- [ ] `ActionButtons.tsx` (Copy, View Sources — max 3)
- [ ] Skeleton loading states (pulsing blocks)

### Source Detail Panel
- [ ] `SourceDetailPanel.tsx` (slide-in from right, 250ms ease-out)
- [ ] Chunk text display
- [ ] Document name + page ref at top
- [ ] Previous/next chunk navigation
- [ ] Relevance score indicator
- [ ] Dismiss: Esc key + close button

### Shared Components
- [ ] `Toast.tsx` (top-right, auto-dismiss 5s)
- [ ] `Badge.tsx` (file type: PDF/DOCX/TXT)
- [ ] `Avatar.tsx` (initials circle)
- [ ] `IconButton.tsx` (standardized 28×28 icon button)

### Hooks & API Integration
- [ ] `api/client.ts` (Axios instance + JWT header injection + 401 interceptor)
- [ ] `useUpload.ts` (upload + status polling)
- [ ] `useChat.ts` (query, SSE stream, citation parsing)
- [ ] `useSearch.ts` (search bar state, keyboard shortcuts)

### All Error & Empty States
- [ ] Upload fails → red-tinted indicator + "Retry"
- [ ] No results found → inline message in chat
- [ ] Processing error → toast notification
- [ ] Network error → persistent banner
- [ ] No chats → "No conversations yet" in sidebar
- [ ] No documents → upload-centric empty state in doc list
- [ ] No search results → inline "Nothing found" message

### Keyboard Shortcuts
- [ ] `/` → focus search bar
- [ ] `Ctrl + N` → new chat
- [ ] `Ctrl + K` → search chat history
- [ ] `Enter` → send message
- [ ] `Shift + Enter` → newline in input
- [ ] `Esc` → close source panel / blur input

---

## Phase 4: AI Suggestions (Level 3)

### Worker
- [ ] Implement `generateSummary.ts` (Groq: summarize first 3 chunks)
- [ ] Implement `generateSuggestions.ts` (Groq: generate 3 questions from summary)
- [ ] Parse JSON array from LLM response
- [ ] Store 3 suggestions in PostgreSQL
- [ ] Set `suggestion_status: 'failed'` on document if generation fails
- [ ] Use static fallback suggestions on failure

### API
- [ ] Cache suggestions in Redis on first DB query (TTL 24h)
- [ ] `GET /api/suggestions` (with Redis-first, DB-fallback logic)

### Frontend
- [ ] Update `SuggestionPills.tsx` to fetch real suggestions
- [ ] Show AI suggestions after document processing completes
- [ ] Clicking a suggestion auto-populates + auto-sends the query

### Suggestion Tests
- [ ] Unit: `generateSummary.test.ts` (mock Groq, verify prompt)
- [ ] Unit: `generateSuggestions.test.ts` (JSON parse, fallback on failure)
- [ ] Integration: `GET /api/suggestions` (cache hit + miss)

---

## Phase 6: Testing & QA

### Coverage Pass
- [ ] Run `npm run test -- --coverage` across all packages
- [ ] Assert ≥ 80% line coverage on `api` and `worker`
- [ ] Fix any coverage gaps that block threshold

### E2E Playwright Tests
- [ ] Write `e2e/auth.spec.ts` (Scenario 1: register → empty state)
- [ ] Write `e2e/upload.spec.ts` (Scenarios 2, 6, 7)
- [ ] Write `e2e/chat.spec.ts` (Scenarios 3, 4, 5, 8)
- [ ] Write `e2e/suggestions.spec.ts` (from Scenario 3)
- [ ] Run all 8 scenarios: `npm run test:e2e`
- [ ] All 8 scenarios pass locally

### Final QA Checklist
- [ ] All API endpoints return expected responses in Postman/Thunder Client
- [ ] Dark mode tokens render correctly
- [ ] Accessibility: visible focus rings on all interactive elements
- [ ] Accessibility: `role="log"` + `aria-live="polite"` on chat area
- [ ] Accessibility: all icons have `aria-label`
- [ ] No `console.error` in browser during normal use
- [ ] No `any` TypeScript types without explanatory comment

---

## Phase 7: Deployment

### Infrastructure
- [ ] Provision managed PostgreSQL with pgvector support (Neon / Supabase / Railway)
- [ ] Verify pgvector extension is available on production PostgreSQL
- [ ] Provision managed Redis (Upstash / Railway)

### Deployment
- [ ] Deploy API server (Railway / Fly.io / Render)
- [ ] Deploy Worker service
- [ ] Deploy Frontend (Vercel / Netlify)
- [ ] Set all production environment variables in deploy platform
- [ ] Run `knex migrate:latest` on production DB (enables pgvector + creates all tables)
- [ ] Run `knex seed:run` (creates admin user in production)

### Smoke Testing
- [ ] Health check at `/api/health` returns `status: ok` with `pgvector: enabled`
- [ ] Register a new user on production URL
- [ ] Upload a PDF on production URL
- [ ] Run all 8 Playwright scenarios against production URL
- [ ] Verify CORS is set to production frontend URL only

### Documentation
- [ ] Update `README.md` with full setup, run, and deploy instructions
- [ ] Review and finalize all documentation files
- [ ] Tag `v1.0.0` release in git

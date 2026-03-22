# Development Phases

## Overview

The MVP is broken into 4 sequential phases. Each phase delivers a functional slice of the system. No phase skips testing.

---

## Phase 1 — Foundation & Infrastructure ✅

**Goal:** Project scaffolding, database setup, environment configuration, and base Express/React apps running.

### Tasks

#### Backend
- [x] Initialize `server/` with Node.js + Express
- [x] Configure `package.json` with all dependencies
- [x] Set up `.env` with `DATABASE_URL`, `GROQ_API_KEY`, `PORT`
- [x] Create `server/src/config/db.js` — PostgreSQL connection pool
- [x] Create `server/src/config/env.js` — validate required env vars on startup
- [x] Create `server/src/app.js` — Express app setup with middleware
- [x] Create `server/src/server.js` — HTTP server entry point
- [x] Add global error middleware in `server/src/middlewares/error.middleware.js`
- [x] Set up logger utility in `server/src/utils/logger.js`

#### Database
- [x] Run PostgreSQL locally via Docker
- [x] Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- [x] Create `documents` table
- [x] Create `document_chunks` table with `VECTOR(384)` column
- [x] Create `suggestions` table
- [x] Add ivfflat index on `document_chunks.embedding`
- [x] Add foreign key indexes on `document_id` columns

#### Frontend
- [x] Initialize `client/` with Vite + React + TypeScript
- [x] Install Tailwind CSS, Axios, React Router v6
- [x] Configure `client/.env` with `VITE_API_BASE_URL`
- [x] Create `src/styles/tokens.css` with all CSS custom properties
- [x] Scaffold `App.jsx` with basic router setup
- [x] Create `src/services/api.js` with Axios base configuration

**Exit Criteria:** Both client and server start without errors. DB tables exist and are queryable. ✅

---

## Phase 2 — Document Upload & Processing Pipeline ✅

**Goal:** End-to-end document upload: file → text → chunks → embeddings → DB → suggestions.

### Tasks

#### Backend
- [x] Install multer, pdf-parse, mammoth, @xenova/transformers
- [x] Implement `utils/chunking.js` — split text into 500–800 token chunks with overlap
- [x] Implement `document.service.js` — `extractText()` and `chunkText()`
- [x] Implement `embedding.service.js` — `generateEmbedding(text)` returning 384-dim vector
- [x] Implement `suggestion.service.js` — `generateSuggestions(summary)` via multi-provider LLM
- [x] Implement `document.repository.js` — insert document, insert chunks, insert suggestions, update status
- [x] Implement `upload.controller.js` — validate file, delegate to services
- [x] Create `upload.routes.js` — mount `POST /api/upload`
- [x] Handle all error cases: empty doc, bad type, size limit, processing failure
- [x] Write unit tests for `chunking.js`
- [x] Write unit tests for `document.service.js`
- [x] Write unit tests for `embedding.service.js`
- [x] Write integration test for `POST /api/upload`

#### Frontend
- [x] Build `Upload/Upload.jsx` — click-to-upload + drag-and-drop
- [x] Show upload status: uploading → processing → ready / failed
- [x] Wire to `POST /api/upload` via `services/api.js`
- [x] Write `Upload.test.jsx`

**Exit Criteria:** Upload a PDF/DOCX/TXT → file processed → chunks and embeddings stored in DB → suggestions stored → response returned to frontend. ✅

---

## Phase 3 — Chat / RAG Query Pipeline

**Goal:** User asks a question → semantic search → LLM answer → sources returned to UI.

### Tasks

#### Backend
- [ ] Implement `search.service.js` — `similaritySearch(vector)` returning top-5 chunks
- [ ] Implement `chat.controller.js` — validate query, call embedding + search + LLM
- [ ] Build LLM prompt with system instruction + context chunks + user query
- [ ] Call LLM via multi-provider service and return answer
- [ ] Return structured response: `{ answer, sources[] }`
- [ ] Handle: no match → "No relevant data found", LLM failure → retry once → 503
- [ ] Create `chat.routes.js` — mount `POST /api/chat`
- [ ] Write unit tests for `search.service.js`
- [ ] Write integration test for `POST /api/chat`

#### Frontend
- [ ] Build `Chat/Chat.jsx` — message thread component
- [ ] Build landing state: centered search bar + suggestion pills
- [ ] Build active chat state: scrollable thread + pinned input bar
- [ ] Render user message bubble immediately (optimistic)
- [ ] Show search status indicator: "Searching X documents, found Y chunks"
- [ ] Render AI response (plain text, no bubble)
- [ ] Render citation pills below each AI response
- [ ] Build `Suggestions/Suggestions.jsx` — display + click to populate search bar
- [ ] Wire to `POST /api/chat` and `GET /api/suggestions`
- [ ] Write `Chat.test.jsx` and `Suggestions.test.jsx`

**Exit Criteria:** Query submitted → top-5 chunks retrieved → LLM answer with sources returned → displayed in UI with citation pills.

---

## Phase 4 — Sidebar, Polish & E2E Testing

**Goal:** Complete the UI, sidebar functionality, error/empty states, and full E2E test coverage.

### Tasks

#### Frontend
- [ ] Build `Sidebar/Sidebar.jsx` — chat history grouped by date + document list
- [ ] Implement keyboard shortcuts: `/`, `Ctrl+N`, `Enter`, `Shift+Enter`, `Esc`
- [ ] Implement all error states: upload fail, no results, network error (toast/banner)
- [ ] Implement all empty states: no chats, no documents, no results
- [ ] Implement responsive layout: ≥1024px, 768–1023px, <768px
- [ ] Add loading skeleton for AI response
- [ ] Add document type badges (PDF/DOCX/TXT colors)
- [ ] Build `ChatPage.jsx` — compose all components into the full page
- [ ] Write `Sidebar.test.jsx` and `ChatPage.test.jsx`

#### E2E Tests (Playwright)
- [ ] `upload.spec.js` — upload PDF → status transitions → document appears in sidebar
- [ ] `suggestions.spec.js` — upload document → suggestions appear → click → search bar populated
- [ ] `chat.spec.js` — submit query → AI response with citation pills displayed

#### Deployment
- [ ] Deploy database to Neon — run schema migrations
- [ ] Deploy backend to Render — configure env vars
- [ ] Deploy frontend to Vercel — configure `VITE_API_BASE_URL`
- [ ] Smoke test all 3 endpoints in production

**Exit Criteria:** All E2E scenarios pass. App is deployed and functional on Vercel + Render + Neon.

---

## Phase Summary

| Phase | Focus                        | Key Deliverable                                | Status |
| ----- | ---------------------------- | ---------------------------------------------- | ------ |
| 1     | Foundation & Infrastructure  | Both apps run, DB tables exist                 | ✅ Done |
| 2     | Upload & Processing Pipeline | File → embeddings → DB → suggestions           | ✅ Done |
| 3     | RAG Query Pipeline           | Query → vector search → LLM answer → citations | 🔄 Next |
| 4     | Sidebar, Polish & E2E        | Full UI + all tests passing + deployed         | ⏳ Pending |

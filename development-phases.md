# Development Phases

## Overview

The MVP is broken into 4 sequential phases. Each phase delivers a functional slice of the system. No phase skips testing.

---

## Phase 1 — Foundation & Infrastructure

**Goal:** Project scaffolding, database setup, environment configuration, and base Express/React apps running.

### Tasks

#### Backend
- [ ] Initialize `server/` with Node.js + Express
- [ ] Configure `package.json` with all dependencies
- [ ] Set up `.env` with `DATABASE_URL`, `GROQ_API_KEY`, `PORT`
- [ ] Create `server/src/config/db.js` — PostgreSQL connection pool
- [ ] Create `server/src/config/env.js` — validate required env vars on startup
- [ ] Create `server/src/app.js` — Express app setup with middleware
- [ ] Create `server/src/server.js` — HTTP server entry point
- [ ] Add global error middleware in `server/src/middlewares/error.middleware.js`
- [ ] Set up logger utility in `server/src/utils/logger.js`

#### Database
- [ ] Run PostgreSQL locally via Docker
- [ ] Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- [ ] Create `documents` table
- [ ] Create `document_chunks` table with `VECTOR(768)` column
- [ ] Create `suggestions` table
- [ ] Add ivfflat index on `document_chunks.embedding`
- [ ] Add foreign key indexes on `document_id` columns

#### Frontend
- [ ] Initialize `client/` with Vite + React + TypeScript
- [ ] Install Tailwind CSS, Axios, React Router v6, Lucide React
- [ ] Configure `client/.env` with `VITE_API_BASE_URL`
- [ ] Create `src/styles/tokens.css` with all CSS custom properties
- [ ] Scaffold `App.jsx` with basic router setup
- [ ] Create `src/services/api.js` with Axios base configuration

**Exit Criteria:** Both client and server start without errors. DB tables exist and are queryable.

---

## Phase 2 — Document Upload & Processing Pipeline

**Goal:** End-to-end document upload: file → text → chunks → embeddings → DB → suggestions.

### Tasks

#### Backend
- [ ] Install multer, pdf-parse, mammoth, sentence-transformers (or equivalent)
- [ ] Implement `utils/chunking.js` — split text into 500–800 token chunks with overlap
- [ ] Implement `document.service.js` — `extractText()` and `chunkText()`
- [ ] Implement `embedding.service.js` — `generateEmbedding(text)` returning 768-dim vector
- [ ] Implement `suggestion.service.js` — `generateSuggestions(summary)` via Groq
- [ ] Implement `document.repository.js` — insert document, insert chunks, insert suggestions, update status
- [ ] Implement `upload.controller.js` — validate file, delegate to services
- [ ] Create `upload.routes.js` — mount `POST /api/upload`
- [ ] Handle all error cases: empty doc, bad type, size limit, processing failure
- [ ] Write unit tests for `chunking.js`
- [ ] Write unit tests for `document.service.js`
- [ ] Write unit tests for `embedding.service.js`
- [ ] Write integration test for `POST /api/upload`

#### Frontend
- [ ] Build `Upload/Upload.jsx` — click-to-upload + drag-and-drop
- [ ] Show upload status: uploading → processing → ready / failed
- [ ] Wire to `POST /api/upload` via `services/api.js`
- [ ] Write `Upload.test.jsx`

**Exit Criteria:** Upload a PDF/DOCX/TXT → file processed → chunks and embeddings stored in DB → suggestions stored → response returned to frontend.

---

## Phase 3 — Chat / RAG Query Pipeline

**Goal:** User asks a question → semantic search → LLM answer → sources returned to UI.

### Tasks

#### Backend
- [ ] Implement `search.service.js` — `similaritySearch(vector)` returning top-5 chunks
- [ ] Implement `chat.controller.js` — validate query, call embedding + search + LLM
- [ ] Build LLM prompt with system instruction + context chunks + user query
- [ ] Call Groq API and return answer
- [ ] Return structured response: `{ answer, sources[] }`
- [ ] Handle: no match → "No relevant data found", Groq failure → retry once → 503
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

| Phase | Focus                        | Key Deliverable                                |
| ----- | ---------------------------- | ---------------------------------------------- |
| 1     | Foundation & Infrastructure  | Both apps run, DB tables exist                 |
| 2     | Upload & Processing Pipeline | File → embeddings → DB → suggestions           |
| 3     | RAG Query Pipeline           | Query → vector search → LLM answer → citations |
| 4     | Sidebar, Polish & E2E        | Full UI + all tests passing + deployed         |

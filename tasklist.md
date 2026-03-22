# Task List

## Phase 1 — Foundation & Infrastructure ✅

### Database
- [x] Start PostgreSQL locally via Docker (use `ankane/pgvector` image)
- [x] Create `knowbase` database
- [x] Enable pgvector extension
- [x] Create `documents` table
- [x] Create `document_chunks` table with `VECTOR(384)` column
- [x] Create `suggestions` table
- [x] Add ivfflat index on `document_chunks.embedding`
- [x] Add indexes on `document_id` FK columns

### Backend
- [x] Initialize `server/` — `npm init`, install Express, dotenv, pg, cors, multer
- [x] Create `server/.env` with `DATABASE_URL`, `GROQ_API_KEY`, `PORT`
- [x] Create `server/src/config/db.js` — pg connection pool
- [x] Create `server/src/config/env.js` — validate required env vars at startup
- [x] Create `server/src/app.js` — Express app, JSON + cors middleware
- [x] Create `server/src/server.js` — start HTTP server
- [x] Create `server/src/middlewares/error.middleware.js` — global error handler
- [x] Create `server/src/utils/logger.js`
- [x] Confirm server starts and DB connection succeeds

### Frontend
- [x] Initialize `client/` — Vite + React + TypeScript
- [x] Install Tailwind CSS, Axios, React Router v6
- [x] Create `client/.env` with `VITE_API_BASE_URL`
- [x] Create `src/styles/tokens.css` — all CSS custom properties from UIDesign.md
- [x] Scaffold `App.jsx` with router
- [x] Create `src/services/api.js` — Axios instance with base URL
- [x] Confirm frontend starts without errors

---

## Phase 2 — Upload & Processing Pipeline ✅

### Backend
- [x] Install pdf-parse, mammoth, @xenova/transformers
- [x] Implement `server/src/utils/chunking.js`
  - [x] Split text into 500–800 token chunks
  - [x] Implement overlap between chunks
- [x] Implement `server/src/services/document.service.js`
  - [x] `extractText(file, mimeType)` — dispatch to pdf-parse / mammoth / fs
  - [x] `chunkText(text)` — call chunking util
- [x] Implement `server/src/services/embedding.service.js`
  - [x] `generateEmbedding(text)` — return 384-dim float array (Xenova/all-MiniLM-L6-v2)
- [x] Implement `server/src/services/suggestion.service.js`
  - [x] `generateSuggestions(summary)` — call multi-provider LLM, return 3 questions
- [x] Implement `server/src/repositories/document.repository.js`
  - [x] `insertDocument(name, fileType, fileSize)`
  - [x] `insertChunk(documentId, content, chunkIndex, embedding)`
  - [x] `insertSuggestion(documentId, question)`
  - [x] `updateDocumentStatus(id, status)`
  - [x] `getChunksByDocumentId(documentId)`
  - [x] `getSuggestionsByDocumentId(documentId)`
- [x] Implement `server/src/controllers/upload.controller.js`
  - [x] Validate file present, type, size
  - [x] Delegate to services
  - [x] Return `{ documentId, name, status, chunkCount, suggestions[] }`
- [x] Create `server/src/routes/upload.routes.js` — `POST /api/upload`
- [x] Wire routes into `app.js`

### Backend Tests
- [x] Unit test: `chunking.js` — chunk sizes, overlap, edge cases
- [x] Unit test: `document.service.js` — text extraction mocked
- [x] Unit test: `embedding.service.js` — mock model, assert 384-dim output
- [x] Integration test: `POST /api/upload` — happy path + all error cases

### Frontend
- [x] Build `Upload/Upload.jsx`
  - [x] Click-to-upload button
  - [x] Drag-and-drop zone
  - [x] File type and size validation (client-side)
  - [x] Status indicator: uploading → processing → ready / failed
- [x] Wire `Upload.jsx` to `POST /api/upload` via `services/api.js`
- [x] Write `Upload.test.jsx`

---

## Phase 3 — RAG Query Pipeline 🔄

### Backend
- [ ] Implement `server/src/services/search.service.js`
  - [ ] `similaritySearch(queryVector)` — pgvector top-5 cosine search
- [ ] Implement `server/src/controllers/chat.controller.js`
  - [ ] Validate query present + non-empty
  - [ ] Call embedding service on query
  - [ ] Call search service
  - [ ] Build LLM prompt with system + context + user
  - [ ] Call LLM via multi-provider service
  - [ ] Return `{ answer, sources[] }`
  - [ ] Handle no-match → `"No relevant data found"`
  - [ ] Handle LLM failure → retry once → 503
- [ ] Create `server/src/routes/chat.routes.js` — `POST /api/chat`
- [ ] Implement `server/src/controllers/suggestion.controller.js`
- [ ] Create `server/src/routes/suggestion.routes.js` — `GET /api/suggestions`
- [ ] Wire all routes into `app.js`

### Backend Tests
- [ ] Unit test: `search.service.js` — mock DB, assert top-5 returned
- [ ] Unit test: `suggestion.service.js` — mock LLM, assert 3 questions
- [ ] Integration test: `POST /api/chat` — valid query, missing query, no match
- [ ] Integration test: `GET /api/suggestions` — valid id, missing id, not found

### Frontend
- [ ] Build `Chat/Chat.jsx`
  - [ ] Landing state: centered search bar + suggestion pills
  - [ ] Active state: scrollable thread + pinned input bar
  - [ ] Render user message bubble immediately (optimistic)
  - [ ] Show search status indicator
  - [ ] Render AI response (plain text, no bubble)
  - [ ] Render citation pills below AI response
  - [ ] Action buttons: Copy, View Sources
- [ ] Build `Suggestions/Suggestions.jsx`
  - [ ] Fetch suggestions via `GET /api/suggestions`
  - [ ] Render suggestion pills
  - [ ] Click → populate search bar
- [ ] Build `pages/ChatPage.jsx` — compose chat layout
- [ ] Wire to API via `services/api.js`
- [ ] Write `Chat.test.jsx`, `Suggestions.test.jsx`, `ChatPage.test.jsx`

---

## Phase 4 — Sidebar, Polish & E2E ⏳

### Frontend
- [ ] Build `Sidebar/Sidebar.jsx`
  - [ ] Chat history list grouped by date (TODAY / YESTERDAY / THIS WEEK)
  - [ ] Document list with file type badges
  - [ ] New chat button
  - [ ] Chat history search bar
  - [ ] User profile footer with avatar
  - [ ] Empty states for no chats and no documents
- [ ] Implement keyboard shortcuts
  - [ ] `/` → focus search bar
  - [ ] `Ctrl+N` → new chat
  - [ ] `Ctrl+K` → focus sidebar search
  - [ ] `Esc` → blur input / close panel
- [ ] Implement error states
  - [ ] Upload failure: red indicator + retry
  - [ ] No results: inline message
  - [ ] Processing error: toast (top-right, 5s auto-dismiss)
  - [ ] Network error: persistent banner
- [ ] Implement loading skeleton for AI response
- [ ] Implement responsive layout
  - [ ] ≥ 1024px: full sidebar + main
  - [ ] 768–1023px: icon-only collapsed sidebar
  - [ ] < 768px: slide-over drawer
- [ ] Write `Sidebar.test.jsx`

### E2E Tests (Playwright)
- [ ] `upload.spec.js` — full upload flow with status transitions
- [ ] `suggestions.spec.js` — suggestions appear + click → search bar populated
- [ ] `chat.spec.js` — query → AI response + citation pills
- [ ] `chat.spec.js` — no match scenario
- [ ] `upload.spec.js` — error handling (bad type, size limit)
- [ ] `chat.spec.js` — keyboard navigation

### Deployment
- [ ] Create Neon project, enable pgvector, run schema migrations
- [ ] Deploy backend to Render, set all env vars
- [ ] Deploy frontend to Vercel, set `VITE_API_BASE_URL`
- [ ] Smoke test: upload document in production
- [ ] Smoke test: query in production
- [ ] Smoke test: suggestions in production

---

## Completion Checklist

Before marking MVP complete:

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All component tests passing
- [ ] All E2E scenarios passing
- [ ] No hardcoded secrets anywhere
- [ ] All `.env.example` files created
- [ ] Production deployment fully functional
- [ ] API contract matches implementation

# Task List

## Phase 1 — Foundation & Infrastructure

### Database
- [ ] Start PostgreSQL locally via Docker (use `ankane/pgvector` image)
- [ ] Create `knowbase` database
- [ ] Enable pgvector extension
- [ ] Create `documents` table
- [ ] Create `document_chunks` table with `VECTOR(768)` column
- [ ] Create `suggestions` table
- [ ] Add ivfflat index on `document_chunks.embedding`
- [ ] Add indexes on `document_id` FK columns

### Backend
- [ ] Initialize `server/` — `npm init`, install Express, dotenv, pg, cors, multer
- [ ] Create `server/.env` with `DATABASE_URL`, `GROQ_API_KEY`, `PORT`
- [ ] Create `server/src/config/db.js` — pg connection pool
- [ ] Create `server/src/config/env.js` — validate required env vars at startup
- [ ] Create `server/src/app.js` — Express app, JSON + cors middleware
- [ ] Create `server/src/server.js` — start HTTP server
- [ ] Create `server/src/middlewares/error.middleware.js` — global error handler
- [ ] Create `server/src/utils/logger.js`
- [ ] Confirm server starts and DB connection succeeds

### Frontend
- [ ] Initialize `client/` — Vite + React + TypeScript
- [ ] Install Tailwind CSS, Axios, React Router v6, Lucide React
- [ ] Create `client/.env` with `VITE_API_BASE_URL`
- [ ] Create `src/styles/tokens.css` — all CSS custom properties from UIDesign.md
- [ ] Scaffold `App.jsx` with router
- [ ] Create `src/services/api.js` — Axios instance with base URL
- [ ] Confirm frontend starts without errors

---

## Phase 2 — Upload & Processing Pipeline

### Backend
- [ ] Install pdf-parse, mammoth, sentence-transformers (or @xenova/transformers)
- [ ] Implement `server/src/utils/chunking.js`
  - [ ] Split text into 500–800 token chunks
  - [ ] Implement overlap between chunks
- [ ] Implement `server/src/services/document.service.js`
  - [ ] `extractText(file, mimeType)` — dispatch to pdf-parse / mammoth / fs
  - [ ] `chunkText(text)` — call chunking util
- [ ] Implement `server/src/services/embedding.service.js`
  - [ ] `generateEmbedding(text)` — return 768-dim float array
- [ ] Implement `server/src/services/suggestion.service.js`
  - [ ] `generateSuggestions(summary)` — call Groq, return 3 questions
- [ ] Implement `server/src/repositories/document.repository.js`
  - [ ] `insertDocument(name, fileType, fileSize)`
  - [ ] `insertChunk(documentId, content, chunkIndex, embedding)`
  - [ ] `insertSuggestion(documentId, question)`
  - [ ] `updateDocumentStatus(id, status)`
  - [ ] `getChunksByDocumentId(documentId)`
  - [ ] `getSuggestionsByDocumentId(documentId)`
- [ ] Implement `server/src/controllers/upload.controller.js`
  - [ ] Validate file present, type, size
  - [ ] Delegate to services
  - [ ] Return `{ documentId, name, status, chunkCount, suggestions[] }`
- [ ] Create `server/src/routes/upload.routes.js` — `POST /api/upload`
- [ ] Wire routes into `app.js`

### Backend Tests
- [ ] Unit test: `chunking.js` — chunk sizes, overlap, edge cases
- [ ] Unit test: `document.service.js` — text extraction mocked
- [ ] Unit test: `embedding.service.js` — mock model, assert 768-dim output
- [ ] Integration test: `POST /api/upload` — happy path + all error cases

### Frontend
- [ ] Build `Upload/Upload.jsx`
  - [ ] Click-to-upload button
  - [ ] Drag-and-drop zone
  - [ ] File type and size validation (client-side)
  - [ ] Status indicator: uploading → processing → ready / failed
- [ ] Wire `Upload.jsx` to `POST /api/upload` via `services/api.js`
- [ ] Write `Upload.test.jsx`

---

## Phase 3 — RAG Query Pipeline

### Backend
- [ ] Implement `server/src/services/search.service.js`
  - [ ] `similaritySearch(queryVector)` — pgvector top-5 cosine search
- [ ] Implement `server/src/controllers/chat.controller.js`
  - [ ] Validate query present + non-empty
  - [ ] Call embedding service on query
  - [ ] Call search service
  - [ ] Build LLM prompt with system + context + user
  - [ ] Call Groq API
  - [ ] Return `{ answer, sources[] }`
  - [ ] Handle no-match → `"No relevant data found"`
  - [ ] Handle Groq failure → retry once → 503
- [ ] Create `server/src/routes/chat.routes.js` — `POST /api/chat`
- [ ] Implement `server/src/controllers/suggestion.controller.js`
- [ ] Create `server/src/routes/suggestion.routes.js` — `GET /api/suggestions`
- [ ] Wire all routes into `app.js`

### Backend Tests
- [ ] Unit test: `search.service.js` — mock DB, assert top-5 returned
- [ ] Unit test: `suggestion.service.js` — mock Groq, assert 3 questions
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

## Phase 4 — Sidebar, Polish & E2E

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

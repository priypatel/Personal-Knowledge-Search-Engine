# Engineering Scope Definition

## Product Scope

Knowbase MVP is a single-user, document-based RAG (Retrieval-Augmented Generation) search engine. It accepts document uploads, processes them into searchable vector embeddings, and answers natural language queries strictly from uploaded content.

---

## In Scope (MVP)

### Backend

- [ ] Express.js REST API with 3 endpoints: `POST /api/upload`, `POST /api/chat`, `GET /api/suggestions`
- [ ] File upload handling with multer (PDF, DOCX, TXT, max 10MB)
- [ ] Text extraction: pdf-parse (PDF), mammoth (DOCX), fs (TXT)
- [ ] Text chunking (500–800 tokens, with overlap) in `utils/chunking.js`
- [ ] Embedding generation using sentence-transformers (768-dim)
- [ ] PostgreSQL storage via node-postgres (documents, chunks, suggestions tables)
- [ ] pgvector cosine similarity search, top-k=5
- [ ] Groq LLM API integration for answer generation
- [ ] Groq LLM API integration for suggestion generation (3 questions per document)
- [ ] Repository layer isolating all DB queries
- [ ] Global error middleware
- [ ] Environment variable configuration (no hardcoded secrets)

### Frontend

- [ ] React (Vite) single-page application
- [ ] Landing state: centered search bar + suggestion pills
- [ ] Active chat view: message thread + citation pills + action buttons
- [ ] Sidebar: chat history grouped by date + document list with type badges
- [ ] Document upload (click + drag-and-drop) with status transitions
- [ ] Optimistic user message rendering
- [ ] Citation pills with source references per AI response
- [ ] Keyboard shortcuts: `/`, `Ctrl+N`, `Enter`, `Shift+Enter`, `Esc`
- [ ] Error states: upload failure, no results, network error (toast/banner)
- [ ] Empty states for chat history, documents, search results
- [ ] Responsive layout (desktop ≥1024px, tablet 768–1023px, mobile <768px)
- [ ] Tailwind CSS with CSS custom property design tokens

### Database

- [ ] `documents` table
- [ ] `document_chunks` table with VECTOR(768) column
- [ ] `suggestions` table
- [ ] ivfflat index on `document_chunks.embedding`
- [ ] CASCADE deletes (chunks + suggestions deleted with document)

### Testing

- [ ] Unit tests for all services (Jest)
- [ ] Unit tests for chunking utility
- [ ] Integration tests for API endpoints
- [ ] Component tests for all React components (Jest + React Testing Library)
- [ ] E2E tests: upload flow, chat flow, suggestions flow (Playwright)

### Deployment

- [ ] Frontend → Vercel
- [ ] Backend → Render
- [ ] Database → Neon (PostgreSQL + pgvector)

---

## Out of Scope (MVP)

| Feature                              | Reason                                    |
| ------------------------------------ | ----------------------------------------- |
| User authentication / accounts       | Single-user MVP                           |
| Multi-user support                   | Post-MVP                                  |
| General AI chatbot mode              | Core principle violation                  |
| Document editing / annotation        | Not in PRD                                |
| Real-time collaboration              | Post-MVP                                  |
| MongoDB or any non-Postgres DB       | Architecture constraint                   |
| Qdrant / Pinecone vector DB          | Architecture constraint                   |
| Redis caching layer                  | Optional only if needed for performance   |
| Full-text search (non-vector)        | Not required by PRD                       |
| Document versioning                  | Post-MVP                                  |
| PDF viewer / document preview        | Post-MVP                                  |
| OAuth / SSO                          | Post-MVP                                  |
| Rate limiting                        | Post-MVP                                  |
| Analytics / usage tracking           | Post-MVP                                  |
| Streaming responses (token-by-token) | Optional in PRD                           |
| Source detail panel (full UI)        | Marked as future screen in UIDesign.md    |
| Document management screen (full UI) | Marked as future screen in UIDesign.md    |

---

## Architecture Boundaries (Non-Negotiable)

| Boundary                            | Rule                                       |
| ----------------------------------- | ------------------------------------------ |
| Controller layer                    | No business logic — routing + validation only |
| Service layer                       | All business logic lives here              |
| Repository layer                    | DB queries only — no logic                 |
| Frontend ↔ Backend                  | Only via REST API — no shared code         |
| Database                            | PostgreSQL only — no substitutions         |
| Secrets                             | Environment variables only — never hardcoded |
| Folder structure                    | Locked — do not restructure               |

---

## Definition of Done

A feature is considered done when:

1. Implementation matches the API contract and PRD requirements
2. Unit tests written and passing
3. Integration tests passing (for API endpoints)
4. Component tests passing (for UI components)
5. No hardcoded values (all config via env vars)
6. Error states handled and tested
7. Code reviewed against architecture rules (no logic in controllers, no DB calls outside repositories)

---

## Tech Stack Summary (Strict)

| Layer       | Technology                  |
| ----------- | --------------------------- |
| Frontend    | React 18 + Vite + TypeScript + Tailwind CSS + Axios |
| Backend     | Node.js + Express.js        |
| Database    | PostgreSQL + pgvector        |
| LLM         | Groq API                    |
| Embeddings  | sentence-transformers (768-dim) |
| File parse  | pdf-parse + mammoth         |
| Testing     | Jest + React Testing Library + Playwright |
| Deployment  | Vercel + Render + Neon      |

Do NOT deviate from this stack without explicit approval.

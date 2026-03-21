# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
│                    React + Vite (Vercel)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼─────────────────────────────────┐
│                      Backend API                             │
│                 Node.js + Express (Render)                   │
│                                                             │
│  ┌────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Controllers│  │    Services      │  │  Repositories    │  │
│  │  (routes)  │→ │  (business logic)│→ │  (DB access)     │  │
│  └────────────┘  └────────┬────────┘  └────────┬─────────┘  │
│                           │                    │             │
│                    ┌──────▼──────┐             │             │
│                    │  Groq API   │             │             │
│                    │    (LLM)    │             │             │
│                    └─────────────┘             │             │
└────────────────────────────────────────────────┼────────────┘
                                                 │ SQL + pgvector
┌────────────────────────────────────────────────▼────────────┐
│                     PostgreSQL + pgvector                    │
│                       Neon (production)                      │
│                     Docker (local dev)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Internal Backend Layers

### 1. Controller Layer

- Handles HTTP routing only
- Validates request shape (file present, required fields)
- Delegates immediately to service layer
- No business logic permitted

Files:
- `server/src/controllers/upload.controller.js`
- `server/src/controllers/chat.controller.js`
- `server/src/controllers/suggestion.controller.js`

### 2. Service Layer

- Contains all business logic
- Orchestrates document processing, embedding, LLM calls
- Calls repositories for DB access
- Calls external APIs (Groq, embedding model)

Files:
- `server/src/services/document.service.js` — text extraction, chunking
- `server/src/services/embedding.service.js` — generate embeddings
- `server/src/services/search.service.js` — vector similarity search
- `server/src/services/suggestion.service.js` — generate + retrieve suggestions

### 3. Repository Layer

- Isolated DB query functions only
- No business logic in repositories
- All SQL lives here

Files:
- `server/src/repositories/document.repository.js`

### 4. Database Layer

- PostgreSQL with pgvector extension
- Three tables: `documents`, `document_chunks`, `suggestions`
- ivfflat index on embedding column

---

## Data Pipelines

### Upload Pipeline

```
HTTP POST /api/upload (multipart/form-data)
  │
  ▼ upload.controller.js
  │   → validates file present, type, size
  │
  ▼ document.service.js
  │   → extractText(file)          [pdf-parse / mammoth / fs]
  │   → chunkText(text)            [500–800 token chunks]
  │
  ▼ embedding.service.js
  │   → generateEmbedding(chunk)   [sentence-transformers, 768-dim]
  │   → (repeat for each chunk)
  │
  ▼ document.repository.js
  │   → INSERT INTO documents
  │   → INSERT INTO document_chunks (×n)
  │
  ▼ document.service.js
  │   → generateSummary(text)      [Groq LLM]
  │
  ▼ suggestion.service.js
  │   → generateSuggestions(summary) [Groq LLM → 3 questions]
  │
  ▼ document.repository.js
  │   → INSERT INTO suggestions (×3)
  │
  ▼ HTTP 200 { documentId, suggestions[] }
```

### Query Pipeline (RAG)

```
HTTP POST /api/chat
  │
  ▼ chat.controller.js
  │   → validates query string present
  │
  ▼ embedding.service.js
  │   → generateEmbedding(query)   [768-dim vector]
  │
  ▼ search.service.js
  │   → similaritySearch(vector)   [pgvector cosine, k=5]
  │
  ▼ document.repository.js
  │   → SELECT top-5 chunks by cosine distance
  │
  ▼ chat.controller.js / service
  │   → Build LLM prompt:
  │     system: "Answer only from provided context"
  │     context: [chunk1...chunk5]
  │     user: query
  │
  ▼ Groq API
  │   → Stream / return answer
  │
  ▼ HTTP 200 { answer, sources[] }
```

### Suggestion Retrieval

```
HTTP GET /api/suggestions?documentId=<id>
  │
  ▼ suggestion.controller.js
  │
  ▼ document.repository.js
  │   → SELECT * FROM suggestions WHERE document_id = ?
  │
  ▼ HTTP 200 { suggestions[] }
```

---

## External Services

| Service             | Provider           | Purpose                                      |
| ------------------- | ------------------ | -------------------------------------------- |
| LLM (inference)     | Groq API           | Answer generation + suggestion generation    |
| Embedding model     | sentence-transformers | Generate 768-dim vectors for text         |
| Database            | Neon (prod) / Docker (local) | PostgreSQL + pgvector storage   |
| Frontend hosting    | Vercel             | Static React build deployment                |
| Backend hosting     | Render             | Node.js API server                           |

---

## Error Handling Strategy

| Scenario                     | Handling                                      |
| ---------------------------- | --------------------------------------------- |
| Empty document               | Reject at extraction — return 400             |
| File type not supported      | Reject at controller — return 400             |
| File size > 10MB             | Reject before upload — return 400             |
| Embedding generation fails   | Abort pipeline — return 500, mark doc failed  |
| No vector match found        | Return "No relevant data found" — 200         |
| Groq API failure             | Retry once — if still fails, return 503       |
| DB connection error          | Return 503 with error message                 |

---

## Performance Considerations

- ivfflat index on `document_chunks.embedding` for fast vector search
- k=5 retrieval limit keeps LLM prompt size manageable
- Suggestions cached in DB — not regenerated per request
- Stateless backend — horizontally scalable (future)
- No session state stored on server

---

## Security Constraints

- All secrets in environment variables — never hardcoded
- API keys: `GROQ_API_KEY`, `DATABASE_URL` loaded from `.env`
- No user authentication in MVP (single-user system)
- Input validation on all API endpoints

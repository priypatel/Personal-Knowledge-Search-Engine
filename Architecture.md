# Architecture Document

## System Overview

Frontend (Vercel)
↓
Backend API (Render)
↓
PostgreSQL (Neon + pgvector)

---

## Internal Architecture

### Layers

1. Controller Layer
2. Service Layer
3. Repository Layer
4. Database

---

## Data Pipeline

Upload:

1. File → text
2. Text → chunks
3. Chunks → embeddings
4. Store

Search:

1. Query → embedding
2. Vector similarity search
3. Retrieve chunks
4. LLM response

---

## Database Index (IMPORTANT)

CREATE INDEX ON document_chunks
USING ivfflat (embedding vector_cosine_ops);

---

## Environment Setup

### Local

- Postgres (Docker)
- Backend local

### Production

- Neon (DB)
- Render (API)
- Vercel (frontend)

---

## Testing Strategy

### Unit (Jest)

- chunking
- embedding generation

### E2E (Playwright)

Scenarios:

- upload document
- suggestions appear
- click suggestion → response
- query → correct sources

---

## Rules (STRICT)

- No hardcoded values
- Use environment variables
- Every feature must have tests
- Follow API contract strictly

# Tech Stack (STRICT)

## Frontend

- React (Vite)
- Tailwind CSS
- Axios (API calls)
- typescript

---

## Backend

- Node.js
- Express.js

---

## Database

- PostgreSQL (Neon for production)
- pgvector extension (for embeddings)

---

## AI / LLM

- Groq API (for answer generation + suggestions)

---

## Embeddings

- sentence-transformers (local or API-based)

---

## File Processing

- pdf-parse (PDF)
- mammoth (DOCX)

---

## Testing

- Jest (unit + integration)
- Playwright (E2E)

---

## Deployment

- Frontend → Vercel
- Backend → Render
- Database → Neon

---

## Optional (if needed)

- Redis (Upstash) → caching / queue

---

## Constraints (VERY IMPORTANT)

- Do NOT replace PostgreSQL with MongoDB
- Do NOT introduce any new database
- Do NOT use Qdrant or Pinecone
- Follow this stack strictly

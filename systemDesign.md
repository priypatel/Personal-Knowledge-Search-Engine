## High-Level Components

1. API Server
2. Worker Service
3. Vector Database (Qdrant)
4. Relational Database (PostgreSQL)
5. Redis Queue

---

## Upload Flow

User uploads file
→ API
→ Queue (Redis)
→ Worker
→ Text extraction
→ Chunking
→ Embeddings
→ Store in Qdrant
→ Generate summary
→ LLM generates suggestions
→ Store in PostgreSQL

---

## Query Flow (RAG ONLY)

User query
→ API
→ Convert to embedding
→ Vector search (Qdrant)
→ Retrieve top-k chunks
→ Send to LLM (Groq)
→ Return answer + sources

---

## Suggestions Flow

Frontend loads page
→ API fetches suggestions
→ Suggestions shown below input
→ On click → auto-send query

---

## Scalability

- Stateless API
- Horizontal worker scaling
- Cached suggestions (avoid recompute)

---

## Failure Handling

- Retry jobs (BullMQ)
- Fallback if suggestion generation fails
- Graceful message if no documents

---

## Storage Design

PostgreSQL:

- users
- documents
- suggestions

Qdrant:

- embeddings

---

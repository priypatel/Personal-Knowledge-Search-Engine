# System Design Document

## High-Level Components

1. Frontend (React)
2. Backend (Node.js + Express)
3. PostgreSQL (pgvector)
4. LLM (Groq)

---

## Upload Flow

User uploads file
→ API receives
→ Extract text
→ Chunk text
→ Generate embeddings
→ Store in DB
→ Generate summary
→ Generate suggestions
→ Store suggestions

---

## Query Flow (RAG ONLY)

User query
→ Convert to embedding
→ Query pgvector
→ Retrieve top-k chunks
→ Send to LLM
→ Return answer + sources

---

## Suggestion Flow

After upload:

- generate summary
- send to LLM
- get 3 questions
- store in DB

---

## Performance Design

- Use index on embedding
- Limit k=5
- Cache suggestions

---

## Failure Handling

- Empty document → reject
- No match → return “No relevant data found”
- LLM failure → retry once

---

## Scaling Strategy

- Stateless backend
- DB indexing
- Horizontal API scaling (future)

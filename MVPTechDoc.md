## MVP Scope

Core pipeline + AI suggestions:

1. File upload
2. Text extraction
3. Chunking
4. Embedding generation
5. Vector storage
6. Query + retrieval
7. AI response (RAG only)
8. **AI-based suggestion generation (cached)**

## Tech Stack

Frontend:

- React
- Tailwind

Backend:

- Node.js
- Express

Databases:

- PostgreSQL (metadata + suggestions)
- pgvector (PostgreSQL vector extension)

AI:

- Groq (LLM for answers + suggestions)

Queue:

- Redis + BullMQ

Testing:

- **Playwright (E2E testing)**
- Jest (unit/integration)

## APIs

- POST /upload
- GET /chat
- GET /suggestions

## Suggestion Generation Flow (Level 3)

On document upload:

1. Extract text
2. Generate summary
3. Send to LLM:
   → "Generate 3 useful questions based on this document"
4. Store suggestions in DB

## Constraints

- Max file size: 10MB
- Suggestions generated once and cached

---

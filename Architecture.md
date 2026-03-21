## System Architecture Overview

Frontend (React)
↓
API Server (Express)
↓

-

| Services |
| - Upload Service |
| - Chat (RAG) Service |
| - Suggestion Service |

---

↓
Queue (Redis + BullMQ)
↓
Worker
↓

-

| Processing Layer |
| - Text Extraction |
| - Chunking |
| - Embedding Generation |
| - Summary Generation |
| - AI Suggestion Generation |

---

↓
pgvector (PostgreSQL Vector Extension)

- PostgreSQL (metadata + suggestions)

---

## Detailed Pipeline

1. Upload file
2. Extract text
3. Split into chunks
4. Generate embeddings
5. Store in vector DB
6. Generate summary
7. Generate AI suggestions (Groq)
8. Store suggestions

---

## UI Flow

Single Page:

- Chat + Search
- Upload inside chat
- Suggestions below input
- Sidebar (history)

---

## Testing Strategy

### 1. Unit Tests (Jest)

- Chunking logic
- Embedding generation
- Suggestion generation

### 2. Integration Tests

- Upload → Process → Store
- Suggestion generation pipeline

### 3. E2E Tests (Playwright)

Scenarios:

1. Upload document → suggestions appear
2. Click suggestion → chat starts
3. Ask question → response with sources
4. No document → show proper message

Example:

- Open app
- Upload file
- Wait for processing
- Verify suggestions visible
- Click suggestion
- Verify response + sources

---

## CI/CD Rule

After every code change:

1. Run unit tests
2. Run Playwright tests
3. Fail build if any test fails

---

## Mandatory Engineering Rule

Every feature must include:

- test cases (Jest + Playwright)
- validation
- error handling
- logging

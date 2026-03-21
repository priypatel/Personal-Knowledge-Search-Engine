# Product Requirements Document

## Product Name

Knowbase — Personal Knowledge Search Engine (Document-based RAG)

---

## Objective

Allow users to upload personal documents and ask natural language questions. The system answers strictly from the uploaded documents using semantic search (RAG). No general AI responses are permitted.

---

## Core Principles

- NO general AI answers — all responses grounded in uploaded documents only
- ALL responses must cite sources (document name + matched chunk)
- System must return "No relevant data found" when no relevant content exists

---

## Target User

Single technical user (MVP is single-user). Assumes comfort with developer tools. No onboarding wizard needed.

---

## Feature Specifications

### F1 — Document Upload

| Property       | Requirement                              |
| -------------- | ---------------------------------------- |
| Accepted types | PDF, DOCX, TXT                           |
| Max file size  | 10MB                                     |
| Upload method  | Click-to-upload or drag-and-drop         |
| Status states  | uploading → processing → ready / failed  |

- Reject empty documents at extraction stage
- Reject files exceeding 10MB before upload begins
- Show per-file upload progress indicator
- On failure, show "Upload failed — retry"

---

### F2 — Document Processing Pipeline

Processing happens server-side after upload completes:

1. Extract raw text (pdf-parse for PDF, mammoth for DOCX, fs for TXT)
2. Split text into chunks of 500–800 tokens with overlap
3. Generate 768-dimension vector embeddings per chunk
4. Store document record + all chunks + embeddings in PostgreSQL
5. Generate document summary via Groq LLM
6. Generate 3 suggested questions from summary via Groq LLM
7. Store suggestions in DB linked to document

Error handling:
- Empty document extraction → reject with 400
- Failed embedding generation → abort pipeline, mark document failed

---

### F3 — Chat Interface

- Single-page ChatGPT-style UI
- Landing state: centered search bar with AI suggestion pills
- Active chat state: scrollable message thread + pinned input bar
- User messages appear immediately (optimistic rendering)
- AI response streams token-by-token (optional)
- Enter to send, Shift+Enter for newline

---

### F4 — Semantic Search (RAG Pipeline)

| Property         | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| Retrieval method | pgvector cosine similarity                             |
| Top-k chunks     | k = 5                                                  |
| Embedding model  | sentence-transformers (768-dim)                        |
| LLM              | Groq API                                               |
| Fallback         | "No relevant data found" when no match above threshold |

Query flow:
1. Convert user query to 768-dim embedding
2. Run cosine similarity search against document_chunks
3. Retrieve top-5 chunks
4. Build prompt: system instructions + retrieved chunks + user query
5. Call Groq LLM
6. Return structured answer + source references

---

### F5 — Source References (Mandatory)

Every AI response must include:

- Source document name
- Matched text chunk excerpt
- Rendered as clickable citation pills below the response
- Color-coded: same-document (blue), cross-document (teal)

---

### F6 — AI Suggestions

- Generated once per document at upload time (not per request)
- LLM generates 3 questions based on document summary
- Stored in suggestions table linked to document_id
- Displayed as clickable pills on landing screen
- Clicking populates the search bar with the question text

---

## Non-Goals (MVP)

- No multi-user authentication or accounts
- No general-purpose chatbot mode
- No document editing or annotation
- No vector database (no Qdrant, no Pinecone — PostgreSQL only)
- No MongoDB or any new database

---

## Success Metrics

| Metric                       | Target                   |
| ---------------------------- | ------------------------ |
| End-to-end response time     | < 3 seconds              |
| Answer relevance (manual QA) | Grounded in documents    |
| Suggestion quality           | Questions are answerable |
| Upload success rate          | > 95% for valid files    |

---

## Constraints (Strict)

- No hardcoded API keys or database URLs — use environment variables
- Every feature must have corresponding tests
- Follow API contract strictly — no ad-hoc endpoint changes
- PostgreSQL is the only database — no substitutions

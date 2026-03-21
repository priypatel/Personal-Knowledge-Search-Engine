# Product Requirements Document (PRD)

## Product Name

Personal Knowledge Search Engine (Document-based RAG)

---

## Objective

Allow users to upload documents and ask questions.
System must answer strictly from uploaded documents using semantic search.

---

## Core Principle

- NO general AI answers
- ALL responses must be grounded in user documents
- MUST show sources

---

## Features

### 1. Document Upload

- Accept: PDF, DOCX, TXT
- Max size: 10MB
- Show status: uploading → processing → ready

---

### 2. Document Processing

- Extract text
- Split into chunks (500–800 tokens)
- Generate embeddings
- Store in PostgreSQL (pgvector)

---

### 3. Chat Interface

- Single UI (ChatGPT-style)
- Ask question → get answer
- Streaming response (optional)

---

### 4. Semantic Search (RAG)

- Convert query → embedding
- Retrieve top-k chunks (k=5)
- Pass to LLM (Groq)
- Return structured answer

---

### 5. Source References (MANDATORY)

Each response must include:

- document name
- matched chunk

---

### 6. AI Suggestions (Level 3)

- Generated after document upload
- Based on document summary
- Stored in DB (not generated on each request)

---

## Non-Goals

- No general chatbot
- No multi-user system (MVP)

---

## Success Metrics

- Answer relevance
- Response time < 3s
- Suggestion quality

# Product Requirements Document (PRD)
**Project:** Personal Knowledge Search Engine (Knowbase)
**Version:** 1.0 — MVP
**Date:** March 2026
**Status:** Active

---

## 1. Product Overview

### 1.1 Product Name
**Knowbase** — Personal Knowledge Search Engine

### 1.2 Product Vision
A document-first AI system that allows individuals to query their personal knowledge base using natural language. Unlike general-purpose AI chatbots, Knowbase answers strictly from uploaded documents, ensuring answers are grounded in user-owned content with mandatory source citations.

### 1.3 Problem Statement
Users accumulate knowledge across personal documents (PDFs, Word files, notes) but cannot retrieve it effectively. Keyword search fails due to vocabulary mismatches. General AI tools hallucinate and break trust. Existing RAG tools are enterprise-focused and not tailored to personal datasets.

### 1.4 Product Goal
Build a **document-first AI system** that:
- Answers questions strictly from uploaded documents (RAG — no hallucination)
- Generates **dynamic AI-based suggested questions** from document content (Level 3 feature)
- Provides **source citations** for every answer
- Maintains a **chat history** per session
- Offers a **single, clean UI** combining search, upload, and chat

---

## 2. Target Users

| Persona | Description | Primary Need |
|---|---|---|
| Developer | Tech-savvy, uploads architecture docs, API specs, research papers | Fast semantic lookup across technical docs |
| Student | Uploads lecture notes, textbooks, research papers | Answer questions from study material |
| Researcher | Uploads academic papers, field notes, datasets | Cross-document synthesis and citation |

**Non-target users:** Enterprises needing multi-tenant features, non-technical users expecting hand-holding UI.

---

## 3. Core Feature Requirements

### 3.1 Document Upload (P0 — Must Have)
- **FR-001:** Users can upload files in PDF, DOCX, and TXT formats
- **FR-002:** Maximum file size is 10MB per upload
- **FR-003:** Files are uploaded from the chat input bar (inline upload)
- **FR-004:** Upload progress is shown inline in the input bar
- **FR-005:** Post-upload, text extraction and embedding generation happen asynchronously via a background worker
- **FR-006:** User receives visual confirmation when document is ready to search

### 3.2 Semantic Search & AI Answer (P0 — Must Have)
- **FR-007:** User can type a natural-language question in the search/chat bar
- **FR-008:** The system converts the query to an embedding and performs vector search using pgvector in PostgreSQL
- **FR-009:** Top-K most relevant chunks are retrieved and sent to the LLM (Groq) for answer generation
- **FR-010:** The system returns a synthesized answer using **only** retrieved document content (strict RAG — no general knowledge)
- **FR-011:** Every AI response **must** include source citations (document name + page/chunk reference)
- **FR-012:** Response latency must be < 2–3 seconds (excluding first-token latency on large models)

### 3.3 Source Citations (P0 — Must Have)
- **FR-013:** Citations appear below every AI response as clickable pills
- **FR-014:** Citation pills display source document name and page/chunk reference
- **FR-015:** Clicking a citation opens a source detail panel showing the original text chunk
- **FR-016:** Citations are color-coded by source document (blue for same-doc, teal for cross-doc)

### 3.4 Chat Interface (P0 — Must Have)
- **FR-017:** Single-page interface combining search bar, chat history, and document sidebar
- **FR-018:** Chat history is persisted and shown in the left sidebar grouped by date (Today, Yesterday, This Week)
- **FR-019:** Users can start a new chat at any time
- **FR-020:** Each chat session has a title (auto-generated from first query)
- **FR-021:** The current chat shows a source count badge in the header

### 3.5 AI-Generated Suggestions (P1 — Level 3 Feature)
- **FR-022:** On document upload, the system generates 3 AI-suggested questions based on document content
- **FR-023:** Suggestions are generated via Groq LLM using a document summary
- **FR-024:** Suggestions are stored in PostgreSQL and cached (not regenerated on every page load)
- **FR-025:** Suggestions appear as clickable pills below the search bar on the landing screen
- **FR-026:** Clicking a suggestion auto-populates the chat bar and sends the query

### 3.6 User Authentication (P1 — Must Have for Production)
- **FR-027:** Users can register and log in with email + password
- **FR-028:** Admin accounts are seeded via database migration (not created via UI)
- **FR-029:** JWT-based session management
- **FR-030:** All API routes are protected by authentication middleware

---

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Query response < 2–3s; upload processing < 30s for a 10MB document |
| Reliability | Background jobs retry on failure (BullMQ retry policy) |
| Scalability | Stateless API server; horizontally scalable worker service |
| Security | Input validation on all endpoints; JWT auth; file type restriction |
| Accessibility | WCAG AA compliance; keyboard-navigable UI; screen-reader-friendly chat log |
| Maintainability | Monorepo structure; typed API contracts; full test coverage mandate |

---

## 5. Out of Scope (MVP)

- General AI chat (no ChatGPT-style behavior — strictly document-grounded)
- Multi-tenant enterprise features (shared workspaces, team documents)
- Document management dashboard (viewing, deleting, re-processing) — future screen
- Real-time collaborative chat
- Mobile native apps (iOS/Android)
- External integrations (Google Drive, Notion, Dropbox)

---

## 6. Success Metrics

| Metric | Target | Measurement Method |
|---|---|---|
| Answer relevance | Answers drawn from document content | Manual QA / citation presence |
| Suggestion quality | Suggestions are context-aware and useful | User click-through rate |
| Response latency | < 3s end-to-end | API response time monitoring |
| Upload success rate | > 99% for valid file types | Job queue success rate |
| Test coverage | 80%+ unit + integration | Jest coverage report |

---

## 7. Constraints

- Max file upload: **10MB**
- Document formats: **PDF, DOCX, TXT only**
- LLM provider: **Groq** (primary; no multi-model support in MVP)
- Vector storage: **pgvector** (PostgreSQL extension — embeddings stored alongside relational data)
- Suggestions: **Generated once per document, cached**
- No general-purpose AI — all answers must be document-grounded

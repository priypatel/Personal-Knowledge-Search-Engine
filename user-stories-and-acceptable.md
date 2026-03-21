# User Stories & Acceptance Criteria

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026

---

## Epic 1: Document Upload

### US-001 — Upload a Document
**As a** developer/student/researcher,
**I want to** upload a PDF, DOCX, or TXT file from the chat input bar,
**So that** I can query its contents using natural language.

**Acceptance Criteria:**
- [ ] AC-001-1: Upload button is visible in the search/chat input bar
- [ ] AC-001-2: Clicking "Upload" opens the native file picker dialog
- [ ] AC-001-3: Only PDF, DOCX, and TXT files are accepted; other file types are rejected with an error
- [ ] AC-001-4: Files larger than 10MB are rejected before upload with a warning message
- [ ] AC-001-5: After selecting a valid file, it appears in the input bar with a progress indicator
- [ ] AC-001-6: Upload is submitted to `POST /api/upload` upon form send
- [ ] AC-001-7: A job is enqueued in BullMQ for background processing

### US-002 — View Upload Progress & Confirmation
**As a** user who uploaded a document,
**I want to** see the processing status of my document,
**So that** I know when it is ready to be queried.

**Acceptance Criteria:**
- [ ] AC-002-1: A "Processing..." indicator appears in the chat when a file is being processed
- [ ] AC-002-2: On successful processing, a checkmark + "Ready to search" message appears
- [ ] AC-002-3: On processing failure, a red error indicator appears with a "Retry" option
- [ ] AC-002-4: The document appears in the sidebar document list once processing is complete

---

## Epic 2: Semantic Search & AI Answer

### US-003 — Ask a Question About Uploaded Documents
**As a** user with uploaded documents,
**I want to** type a natural-language question,
**So that** the system searches my documents and returns a relevant, grounded answer.

**Acceptance Criteria:**
- [ ] AC-003-1: The query is submitted via Enter key or Send button
- [ ] AC-003-2: The user's message appears immediately (optimistic UI)
- [ ] AC-003-3: A search status line shows: "Searching X documents..."
- [ ] AC-003-4: The AI response streams token-by-token in the chat
- [ ] AC-003-5: The response is generated strictly from retrieved document chunks (RAG only)
- [ ] AC-003-6: The response is never a hallucinated answer — only content from documents
- [ ] AC-003-7: Response completes within 3 seconds (from query submission to full response)

### US-004 — Receive an Answer When No Documents Are Uploaded
**As a** user with no uploaded documents,
**I want to** get a helpful message instead of an AI response,
**So that** I understand the system requires documents to function.

**Acceptance Criteria:**
- [ ] AC-004-1: If no documents exist and a query is sent, the system responds: "No documents found. Upload a document to get started."
- [ ] AC-004-2: The message is shown inline in the chat, not as an error toast
- [ ] AC-004-3: The message does not invoke the LLM API (no unnecessary API calls)

---

## Epic 3: Source Citations

### US-005 — View Sources for Every AI Answer
**As a** user reading an AI response,
**I want to** see which documents and chunks the answer was drawn from,
**So that** I can verify the answer and read the source material.

**Acceptance Criteria:**
- [ ] AC-005-1: Citation pills appear below every AI response
- [ ] AC-005-2: Each pill shows: citation number, document name, and page/chunk reference
- [ ] AC-005-3: Same-document citations use blue styling; cross-document citations use teal styling
- [ ] AC-005-4: The number of citations shown matches the top-K chunks retrieved

### US-006 — Click a Citation to View Source Text
**As a** user who wants to verify an answer,
**I want to** click a citation pill and read the original text chunk,
**So that** I can see exactly what the AI used to generate the response.

**Acceptance Criteria:**
- [ ] AC-006-1: Clicking a citation pill opens a source detail panel sliding in from the right
- [ ] AC-006-2: The panel shows the original text chunk with document name and chunk/page reference at the top
- [ ] AC-006-3: The panel has previous/next chunk navigation
- [ ] AC-006-4: The panel can be dismissed with Esc key or a close button
- [ ] AC-006-5: A relevance score indicator is shown in the panel

---

## Epic 4: Chat Interface & History

### US-007 — View Chat History in the Sidebar
**As a** returning user,
**I want to** see my previous chat sessions in the sidebar,
**So that** I can resume or reference past searches.

**Acceptance Criteria:**
- [ ] AC-007-1: Chat history is shown in the left sidebar
- [ ] AC-007-2: Chats are grouped by date: TODAY, YESTERDAY, THIS WEEK
- [ ] AC-007-3: Each history item shows the chat title (auto-generated from first query)
- [ ] AC-007-4: Clicking a history item opens the full chat transcript
- [ ] AC-007-5: The active/selected chat item is visually highlighted (primary blue title)

### US-008 — Start a New Chat
**As a** user who wants a fresh search session,
**I want to** start a new chat,
**So that** it doesn't carry over context from my previous queries.

**Acceptance Criteria:**
- [ ] AC-008-1: A "New Chat" button (+ icon) is visible in the sidebar header
- [ ] AC-008-2: Clicking it resets the main content to the landing/empty state
- [ ] AC-008-3: Keyboard shortcut `Ctrl + N` also triggers new chat
- [ ] AC-008-4: The previous chat is saved and visible in history

---

## Epic 5: AI-Generated Suggestions

### US-009 — See Suggested Questions After Uploading a Document
**As a** user who just uploaded a document,
**I want to** see AI-generated suggested questions based on my document,
**So that** I can quickly explore the document's content without thinking of queries.

**Acceptance Criteria:**
- [ ] AC-009-1: 3 suggestion pills appear below the search bar after a document is processed
- [ ] AC-009-2: Suggestions are generated by Groq LLM using the document summary
- [ ] AC-009-3: Suggestions are cached in PostgreSQL and not regenerated on every page load
- [ ] AC-009-4: Each suggestion pill is clickable and auto-populates the search bar with the suggestion text
- [ ] AC-009-5: After clicking, the query is sent automatically

### US-010 — See Placeholder When No Suggestions Are Available
**As a** user with no uploaded documents,
**I want to** see example queries in the suggestion area,
**So that** I understand how to use the product.

**Acceptance Criteria:**
- [ ] AC-010-1: If no documents are uploaded, default static suggestions are shown as examples
- [ ] AC-010-2: Static suggestions clearly indicate they are examples (e.g., "Try: 'What are the main themes in my notes?'")

---

## Epic 6: Authentication

### US-011 — Register a New User Account
**As a** new user,
**I want to** create an account with email and password,
**So that** my documents and chat history are private to me.

**Acceptance Criteria:**
- [ ] AC-011-1: A registration form collects: email, password, confirm password
- [ ] AC-011-2: Validation enforced: email format, password minimum 8 characters
- [ ] AC-011-3: On success, user is logged in and redirected to the main app
- [ ] AC-011-4: On duplicate email, a clear error message is shown
- [ ] AC-011-5: Passwords are hashed with bcrypt before storage

### US-012 — Log In to an Existing Account
**As a** returning user,
**I want to** log in with my email and password,
**So that** I can access my documents and history.

**Acceptance Criteria:**
- [ ] AC-012-1: Login form collects email and password
- [ ] AC-012-2: On success, JWT is issued and stored (HTTP-only cookie or localStorage)
- [ ] AC-012-3: On invalid credentials, a generic error is shown: "Invalid email or password"
- [ ] AC-012-4: Authenticated user is redirected to the main app
- [ ] AC-012-5: Unauthenticated users cannot access any document or chat API routes

### US-013 — Admin Account Management
**As a** system administrator,
**I want** admin accounts to be seeded via database migration (not created via UI),
**So that** admin access is controlled and cannot be self-provisioned.

**Acceptance Criteria:**
- [ ] AC-013-1: No "Create Admin" option exists in the UI
- [ ] AC-013-2: Admin users are created via a seed script in the database layer
- [ ] AC-013-3: Admin role is stored in the `users` table with a `role` field (`user` | `admin`)
- [ ] AC-013-4: Admin-only API routes return 403 for non-admin users

---

## Epic 7: Error Handling & Edge Cases

### US-014 — Handle Upload Failure Gracefully
**As a** user whose upload failed,
**I want to** see a clear error message and be able to retry,
**So that** I don't lose my work.

**Acceptance Criteria:**
- [ ] AC-014-1: Upload failure shows a red-tinted indicator: "Upload failed — retry"
- [ ] AC-014-2: A "Retry" button re-attempts the upload without re-selecting the file
- [ ] AC-014-3: Failed jobs in BullMQ are retried automatically (max 3 attempts)

### US-015 — Handle Network Errors
**As a** user experiencing connectivity issues,
**I want to** see a clear network error indicator,
**So that** I know the issue is connectivity, not the product.

**Acceptance Criteria:**
- [ ] AC-015-1: A persistent banner below the chat header shows: "Connection lost. Retrying..."
- [ ] AC-015-2: The app reconnects automatically when connectivity is restored
- [ ] AC-015-3: The error banner disappears on successful reconnection

---

## Story Priority Summary

| Story | Priority | Epic |
|---|---|---|
| US-001, US-002 | P0 | Document Upload |
| US-003, US-004 | P0 | Semantic Search |
| US-005, US-006 | P0 | Citations |
| US-007, US-008 | P0 | Chat Interface |
| US-009, US-010 | P1 | AI Suggestions |
| US-011, US-012, US-013 | P1 | Authentication |
| US-014, US-015 | P1 | Error Handling |

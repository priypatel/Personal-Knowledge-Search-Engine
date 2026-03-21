# User Stories and Acceptance Criteria

## US-01 — Upload a Document

**As a** user,
**I want to** upload a PDF, DOCX, or TXT file,
**so that** I can search and ask questions about its contents.

### Acceptance Criteria

- [ ] User can click an upload button or drag-and-drop a file onto the upload zone
- [ ] Accepted file types: .pdf, .docx, .txt only — others are rejected with an error message
- [ ] Files larger than 10MB are rejected before upload begins with a warning message
- [ ] Upload progress is shown while the file is being sent to the server
- [ ] Status transitions: uploading → processing → ready
- [ ] On success, the document appears in the sidebar under "Documents"
- [ ] On failure, "Upload failed — retry" is displayed with a retry action
- [ ] Empty documents are rejected with an informative error

---

## US-02 — View AI-Generated Suggestions

**As a** user,
**I want to** see suggested questions after uploading a document,
**so that** I can quickly discover what I can ask.

### Acceptance Criteria

- [ ] After a document finishes processing, 3 suggestion pills appear on the landing screen
- [ ] Suggestions are generated from a document summary by the LLM
- [ ] Suggestions are stored in the database (not regenerated on each page load)
- [ ] Each suggestion pill displays the question text
- [ ] Clicking a suggestion pill populates the search bar with that question
- [ ] Suggestions do not change between sessions (persisted)

---

## US-03 — Ask a Question About a Document

**As a** user,
**I want to** type a natural language question,
**so that** I get an answer grounded in my uploaded documents.

### Acceptance Criteria

- [ ] User types a query into the search bar and presses Enter or clicks the send button
- [ ] User message appears immediately in the chat thread (optimistic render)
- [ ] A search status indicator appears: "Searching X documents, found Y relevant chunks"
- [ ] The system queries pgvector to find the top-5 most relevant chunks
- [ ] The LLM generates a response using only those retrieved chunks
- [ ] The AI response is displayed in the chat thread
- [ ] Response time is under 3 seconds end-to-end
- [ ] If no relevant content is found, system returns "No relevant data found"
- [ ] The system does NOT answer from general AI knowledge — only from documents

---

## US-04 — View Source References

**As a** user,
**I want to** see which documents and passages the answer came from,
**so that** I can verify the response.

### Acceptance Criteria

- [ ] Every AI response includes citation pills below the answer
- [ ] Each citation pill shows: source document name and chunk number/excerpt
- [ ] Same-document citations use blue styling; cross-document citations use teal
- [ ] Clicking a citation pill opens a source detail view or highlights the relevant chunk
- [ ] No AI response is ever returned without at least one source reference

---

## US-05 — Use Keyboard Shortcuts

**As a** user,
**I want to** navigate the app with keyboard shortcuts,
**so that** I can work faster without using the mouse.

### Acceptance Criteria

- [ ] Pressing / focuses the search bar from anywhere in the app
- [ ] Ctrl+N opens a new chat
- [ ] Ctrl+K focuses the sidebar chat history search
- [ ] Enter sends the current message
- [ ] Shift+Enter inserts a newline in the input
- [ ] Esc blurs the input or closes an open panel
- [ ] All shortcuts work consistently across the app

---

## US-06 — View Chat History

**As a** user,
**I want to** see my past conversations in the sidebar,
**so that** I can return to a previous query.

### Acceptance Criteria

- [ ] Sidebar shows a list of previous chats grouped by date (TODAY, YESTERDAY, THIS WEEK)
- [ ] Each chat item shows its title (first message or truncated query)
- [ ] Clicking a chat item loads that conversation in the main area
- [ ] Active chat is visually highlighted in the sidebar
- [ ] When no chats exist, an empty state message is shown: "No conversations yet."

---

## US-07 — Handle Upload Errors Gracefully

**As a** user,
**I want to** receive clear error messages when an upload fails,
**so that** I know what went wrong and can take action.

### Acceptance Criteria

- [ ] Upload failure shows a red-tinted indicator: "Upload failed — retry"
- [ ] Processing error shows a toast notification at top-right, auto-dismisses in 5 seconds
- [ ] Network errors show a persistent banner: "Connection lost. Retrying..."
- [ ] No silent failures — every error has a visible message
- [ ] User can retry a failed upload without refreshing the page

---

## US-08 — Search on Mobile

**As a** user on a mobile device,
**I want to** use the app on a small screen,
**so that** I can search my documents from any device.

### Acceptance Criteria

- [ ] On screens < 768px, the sidebar becomes a slide-over drawer
- [ ] The input bar is pinned to the bottom of the screen
- [ ] Search bar is full-width with reduced padding
- [ ] User message bubbles have max-width 85% of screen
- [ ] Citation pills are horizontally scrollable on overflow
- [ ] Suggestion pills stack vertically instead of wrapping horizontally

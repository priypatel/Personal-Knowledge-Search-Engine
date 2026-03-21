# Testing Strategy

## Principles

- Every feature must have tests before it is considered done
- No hardcoded values in test files — use test fixtures and env vars
- Tests must be deterministic — no reliance on external APIs in unit tests (mock them)
- Test files live alongside their source files (except E2E)

---

## Testing Layers

### 1. Unit Tests (Jest)

**Scope:** Individual functions and services in isolation.

**Tools:** Jest

**Coverage targets:**
- `server/src/utils/chunking.js` — chunking logic
- `server/src/services/document.service.js` — extractText, chunkText
- `server/src/services/embedding.service.js` — generateEmbedding (mock the model)
- `server/src/services/search.service.js` — similaritySearch (mock the DB)
- `server/src/services/suggestion.service.js` — generateSuggestions (mock Groq)

**Location:** `server/tests/unit/`

---

### 2. Integration Tests (Jest + Supertest)

**Scope:** API endpoints tested against a real test database.

**Tools:** Jest + Supertest

**Endpoints to test:**

| Endpoint              | Test Cases                                               |
| --------------------- | -------------------------------------------------------- |
| POST /api/upload      | Valid PDF upload, invalid type, size > 10MB, empty doc  |
| POST /api/chat        | Valid query, missing query, empty query, no match found  |
| GET /api/suggestions  | Valid documentId, missing documentId, not found          |

**Location:** `server/tests/integration/`

**Setup:** Use a separate test database (`knowbase_test`) with the same schema. Truncate tables between tests.

---

### 3. Component Tests (Jest + React Testing Library)

**Scope:** React component rendering and user interactions.

**Tools:** Jest + React Testing Library (RTL)

**Coverage targets:**

| Component            | Test Cases                                               |
| -------------------- | -------------------------------------------------------- |
| `Chat.jsx`           | Renders empty state, renders message list, send message  |
| `Upload.jsx`         | Renders upload button, drag-and-drop zone, status states |
| `Suggestions.jsx`    | Renders suggestion pills, click populates search bar     |
| `Sidebar.jsx`        | Renders chat history, document list, empty states        |
| `ChatPage.jsx`       | Full page renders, keyboard shortcuts                    |
| `services/api.js`    | Correct Axios calls with right URLs and payloads         |

**Location:** Alongside source files (e.g., `Chat.test.jsx` next to `Chat.jsx`)

**Rules:**
- Use `data-testid` attributes for all test selectors
- Mock all API calls in component tests — do not hit real server
- Test error states and loading states, not just happy paths

---

### 4. End-to-End Tests (Playwright)

**Scope:** Full user flows from browser to real backend to real database.

**Tools:** Playwright

**Location:** `client/tests/e2e/`

---

#### E2E Scenario 1 — Document Upload Flow

**File:** `upload.spec.js`

```
1. Navigate to app
2. Click upload button
3. Select a valid PDF file
4. Assert: status shows "uploading"
5. Assert: status transitions to "processing"
6. Assert: status transitions to "ready"
7. Assert: document appears in sidebar document list
8. Assert: document has correct file type badge
```

---

#### E2E Scenario 2 — Suggestion Flow

**File:** `suggestions.spec.js`

```
1. Upload a document (prerequisite)
2. Assert: 3 suggestion pills appear on the landing screen
3. Click a suggestion pill
4. Assert: search bar is populated with the suggestion text
5. Submit the query
6. Assert: AI response is displayed
7. Assert: citation pills are shown below the response
```

---

#### E2E Scenario 3 — Chat / Query Flow

**File:** `chat.spec.js`

```
1. Upload a document (prerequisite)
2. Type a question in the search bar
3. Press Enter
4. Assert: user message appears immediately (optimistic)
5. Assert: search status indicator appears ("Searching X documents...")
6. Assert: AI response renders below the status
7. Assert: at least one citation pill appears
8. Assert: citation pill shows document name
```

---

#### E2E Scenario 4 — No Match Response

**File:** `chat.spec.js`

```
1. Submit a query completely unrelated to any uploaded document
2. Assert: response displays "No relevant data found"
3. Assert: sources array is empty
```

---

#### E2E Scenario 5 — Upload Error Handling

**File:** `upload.spec.js`

```
1. Attempt to upload an unsupported file type (e.g., .exe)
2. Assert: error message displayed (file type not accepted)

3. Attempt to upload a file > 10MB
4. Assert: error message displayed (file size limit)

5. Simulate upload failure (network error or server 500)
6. Assert: "Upload failed — retry" message shown
```

---

#### E2E Scenario 6 — Keyboard Navigation

**File:** `chat.spec.js`

```
1. Navigate to app
2. Press "/" key
3. Assert: search bar receives focus

4. Press Ctrl+N
5. Assert: chat is cleared / new chat state shown

6. Type in search bar, press Shift+Enter
7. Assert: newline inserted, message not sent
```

---

## Test Data

- Use fixture PDF/DOCX/TXT files in `client/tests/e2e/fixtures/` and `server/tests/fixtures/`
- Files should be small (< 50KB) and contain verifiable content for assertions
- Test files should never be production documents

---

## Testing Rules (Strict)

- Every React component MUST have a `.test.jsx` file
- Every service MUST have unit tests
- Playwright must cover: upload flow, suggestion flow, chat flow
- No skipped tests (`it.skip`, `test.skip`) without a documented reason
- Use `data-testid` for all Playwright selectors — never use CSS classes as test selectors
- Mock all external APIs (Groq, embedding model) in unit and component tests
- Integration tests may call real DB — use a separate `knowbase_test` DB

---

## Running Tests

```bash
# Backend unit + integration tests
cd server && npm test

# Frontend component tests
cd client && npm test

# E2E tests (requires both servers running)
cd client && npx playwright test
```

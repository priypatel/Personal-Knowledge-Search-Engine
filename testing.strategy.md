# Testing Strategy

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026

---

## 1. Testing Philosophy

> **Every feature must include test cases before merge. No exceptions.**

Testing in Knowbase follows a **pyramid model**: many unit tests, fewer integration tests, and the critical user flows covered by E2E tests.

```
             ┌──────────────┐
             │   E2E Tests  │   (Playwright) — 8 critical scenarios
             └──────┬───────┘
          ┌─────────┴──────────┐
          │  Integration Tests │  (Jest + Supertest) — all API endpoints
          └─────────┬──────────┘
       ┌────────────┴────────────┐
       │       Unit Tests        │   (Jest) — all pure functions & services
       └─────────────────────────┘
```

**Coverage target:** ≥ 80% on all packages measured at unit + integration level.

---

## 2. Test Tools

| Layer | Tool | Package |
|---|---|---|
| Unit tests | Jest | `api`, `worker`, `shared` |
| Integration tests | Jest + Supertest | `api` |
| E2E tests | Playwright | `web` |
| Coverage | Jest `--coverage` (Istanbul) | `api`, `worker` |
| Test DB | Separate PostgreSQL database (with pgvector) | `api` (integration) |
| Mocking | Jest mocks + `msw` (for frontend) | all |

---

## 3. Unit Tests (Jest)

### 3.1 What to Unit Test

Unit tests cover **pure functions and isolated service logic** with real dependencies mocked.

| Module | Test File | What to Test |
|---|---|---|
| `chunkText.ts` | `chunkText.test.ts` | Correct chunk sizes, overlap, edge cases (empty text, very short text, single sentence) |
| `generateEmbeddings.ts` | `generateEmbeddings.test.ts` | Groq API call shape; correct number of embeddings returned; retry on timeout |
| `generateSummary.ts` | `generateSummary.test.ts` | Prompt format; fallback on LLM failure |
| `generateSuggestions.ts` | `generateSuggestions.test.ts` | JSON parse of LLM response; exactly 3 suggestions; fallback static suggestions on parse failure |
| `scoring` / `chat.service.ts` | `chatService.test.ts` | Composite score calculation; de-duplication logic; context assembly token count |
| `extractText.ts` | `extractText.test.ts` | PDF extraction returns string; DOCX extraction returns string; TXT passthrough |
| `auth.service.ts` | `authService.test.ts` | Password hashing; JWT issue; JWT verify; expired token handling |
| `vectorSearch.service.ts` | `vectorSearch.test.ts` | pgvector SQL query formation; user_id filtering; score threshold enforcement |

### 3.2 Unit Test Configuration

```js
// jest.config.js (packages/api or packages/worker)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['./src/test/setup.ts'],  // Loads .env.test
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/db/migrations/**'],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 70 }
  }
};
```

### 3.3 Mocking Strategy

```ts
// Mock Groq API in unit tests
jest.mock('../lib/groq', () => ({
  embeddings: { create: jest.fn().mockResolvedValue({ data: [{ embedding: Array(1536).fill(0) }] }) },
  chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: { content: 'Mock response' } }] }) } }
}));

// Mock pgvector search (via Knex)
jest.mock('../db/knex', () => ({
  raw: jest.fn().mockResolvedValue({ rows: [] })
}));
```

---

## 4. Integration Tests (Jest + Supertest)

### 4.1 What to Integration Test

Integration tests hit **real HTTP endpoints** against a real test database (PostgreSQL with pgvector + Redis). The pgvector extension must be enabled in the test database.

### 4.2 Test Setup

```ts
// src/test/setup.ts
import knex from '../db/knex';

beforeAll(async () => {
  // Run migrations on test DB (includes pgvector extension)
  await knex.migrate.latest();
  // Seed a test user
  await knex('users').insert({ email: 'test@test.com', password: hashPassword('Test123!'), role: 'user' });
});

afterAll(async () => {
  await knex.migrate.rollback(undefined, true); // Rollback all migrations
  await knex.destroy();
});

afterEach(async () => {
  // Clean up test data between tests (except users table seeded in beforeAll)
  await knex('chat_messages').del();
  await knex('chat_sessions').del();
  await knex('suggestions').del();
  await knex('document_embeddings').del();
  await knex('documents').del();
});
```

### 4.3 Integration Test Cases

#### `POST /api/auth/register`
```
✓ registers a new user → returns 201 + JWT
✓ duplicate email → returns 409 EMAIL_ALREADY_EXISTS
✓ missing email field → returns 400 VALIDATION_ERROR
✓ password < 8 chars → returns 400 VALIDATION_ERROR
✓ invalid email format → returns 400 VALIDATION_ERROR
```

#### `POST /api/auth/login`
```
✓ valid credentials → returns 200 + JWT
✓ wrong password → returns 401 INVALID_CREDENTIALS
✓ unregistered email → returns 401 INVALID_CREDENTIALS
✓ missing fields → returns 400 VALIDATION_ERROR
```

#### `POST /api/upload`
```
✓ uploads valid PDF → returns 202 + documentId
✓ uploads valid DOCX → returns 202 + documentId
✓ uploads valid TXT → returns 202 + documentId
✓ unsupported file type (.exe) → returns 400 INVALID_FILE_TYPE
✓ file > 10MB → returns 400 FILE_TOO_LARGE
✓ no file → returns 400 NO_FILE_UPLOADED
✓ unauthorized (no JWT) → returns 401
```

#### `GET /api/documents`
```
✓ returns documents for authenticated user
✓ does not return documents from other users
✓ unauthorized → returns 401
```

#### `GET /api/documents/:id/status`
```
✓ returns processing status for owned document
✓ returns 404 for another user's document
```

#### `POST /api/chat`
```
✓ sends query → returns answer + citations (with pgvector search)
✓ sends query with no documents → returns 400 NO_DOCUMENTS
✓ creates new chat session if sessionId not provided
✓ appends to existing session if sessionId provided
✓ query > 2000 chars → returns 400 QUERY_TOO_LONG
✓ unauthorized → returns 401
```

#### `GET /api/chat/sessions`
```
✓ returns sessions for authenticated user
✓ sessions grouped correctly (by updated_at)
✓ unauthorized → returns 401
```

#### `GET /api/suggestions`
```
✓ returns suggestions from PostgreSQL (cache miss path)
✓ returns suggestions from Redis (cache hit path — mock Redis)
✓ returns empty array when no documents
✓ unauthorized → returns 401
```

#### `GET /api/health`
```
✓ returns 200 with postgres, pgvector, redis status
✓ accessible without auth
```

---

## 5. E2E Tests (Playwright)

### 5.1 Setup

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:5173',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 5.2 E2E Test Scenarios

All 8 scenarios **must pass** before any merge to `main`.

#### Scenario 1 — New User Registration & Empty State
```
1. Open http://localhost:5173
2. Expect redirect to /login
3. Click "Create account"
4. Fill in: email, password, name
5. Submit
6. Assert: landing page visible
7. Assert: "No conversations yet" in sidebar
8. Assert: default suggestion pills visible (static examples)
```

#### Scenario 2 — Upload PDF & See AI Suggestions
```
1. Log in as test user
2. Click Upload in search bar
3. Select a test PDF file (< 10MB)
4. Submit query (or just wait for processing)
5. Assert: "Processing..." indicator visible
6. Wait for processing to complete (poll status or wait for ✓)
7. Assert: document appears in sidebar document list
8. Assert: 3 AI suggestion pills visible below search bar
9. Assert: suggestions are non-empty strings
```

#### Scenario 3 — Click Suggestion → Chat Response + Citations
```
1. Log in, ensure ≥1 ready document
2. Click first suggestion pill
3. Assert: suggestion text appears in input bar
4. Assert: query is auto-sent (user bubble appears)
5. Assert: "Searching X documents..." status line appears
6. Wait for AI response
7. Assert: AI response text is visible (non-empty)
8. Assert: citation pills appear below response
9. Assert: citation pill shows document filename
```

#### Scenario 4 — Type Custom Query → Response + Citations
```
1. Log in, ensure ≥1 ready document
2. Click search bar (or press /)
3. Type: "What is the main topic of this document?"
4. Press Enter
5. Assert: user bubble appears with typed query
6. Assert: AI response streams and completes
7. Assert: citation pills appear
8. Assert: response does not contain hallucinated content (basic check: non-empty)
```

#### Scenario 5 — Click Citation → Source Detail Panel
```
1. Complete a query that returns citations (Scenario 4)
2. Click first citation pill
3. Assert: source detail panel slides in from right
4. Assert: panel contains chunk text (non-empty)
5. Assert: panel shows document name at top
6. Press Esc
7. Assert: panel is closed
```

#### Scenario 6 — Upload Invalid File Type
```
1. Log in
2. Click Upload
3. Select a .docx.zip or .exe file
4. Assert: file is rejected before upload
5. Assert: error message: "Only PDF, DOCX, and TXT files are accepted"
6. Assert: no job is created (document list unchanged)
```

#### Scenario 7 — Upload File > 10MB
```
1. Log in
2. Click Upload
3. Select a file > 10MB
4. Assert: file is rejected before upload
5. Assert: error message indicates file size limit
```

#### Scenario 8 — No Documents → Query Shows Fallback Message
```
1. Log in with a fresh user account (no documents)
2. Click search bar
3. Type any query
4. Press Enter
5. Assert: NO LLM response generated (verify via response text)
6. Assert: Message shown: "No documents found. Upload a document to get started."
```

---

## 6. CI Pipeline Configuration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: ['*']
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint

  unit-integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env: { POSTGRES_DB: knowbase_test, POSTGRES_USER: knowbase, POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-integration-tests]
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env: { POSTGRES_DB: knowbase_test, POSTGRES_USER: knowbase, POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install chromium
      - run: npm run migrate && npm run seed
      - run: npm run dev &    # Start all services
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: packages/web/playwright-report/
```

---

## 7. Test File Organization

```
packages/
├── api/
│   ├── src/
│   │   └── __tests__/
│   │       ├── unit/
│   │       │   ├── auth.service.test.ts
│   │       │   ├── chat.service.test.ts
│   │       │   ├── vectorSearch.service.test.ts
│   │       │   └── suggestion.service.test.ts
│   │       └── integration/
│   │           ├── auth.routes.test.ts
│   │           ├── upload.routes.test.ts
│   │           ├── chat.routes.test.ts
│   │           └── suggestions.routes.test.ts
│   └── src/test/
│       └── setup.ts
├── worker/
│   └── src/__tests__/
│       ├── chunkText.test.ts
│       ├── extractText.test.ts
│       ├── generateEmbeddings.test.ts
│       ├── generateSummary.test.ts
│       └── generateSuggestions.test.ts
└── web/
    └── e2e/
        ├── auth.spec.ts
        ├── upload.spec.ts
        ├── chat.spec.ts
        └── suggestions.spec.ts
```

---

## 8. Test Data

A `fixtures/` directory holds test files:

```
packages/api/src/test/fixtures/
├── sample-small.pdf      ← 500KB test PDF with clear content
├── sample-medium.docx    ← 2MB DOCX file
├── sample.txt            ← Plain text file
├── too-large.pdf         ← 11MB file (for rejection tests)
└── invalid.exe           ← For file type rejection tests
```

---

## 9. Coverage Thresholds

| Package | Lines | Functions | Branches |
|---|---|---|---|
| `packages/api` | ≥ 80% | ≥ 80% | ≥ 70% |
| `packages/worker` | ≥ 80% | ≥ 80% | ≥ 70% |
| `packages/shared` | ≥ 90% | ≥ 90% | ≥ 80% |

Coverage is enforced in Jest config and CI fails if thresholds are not met.

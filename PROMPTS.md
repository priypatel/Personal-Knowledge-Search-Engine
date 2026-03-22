# Phase Prompts for Knowbase MVP

Paste each prompt exactly as written. After each phase: test → git commit → paste next prompt.

---

## PHASE 1 PROMPT

```
You are building "Knowbase" — a personal document-based RAG search engine.

## Project Overview
- Monorepo: `client/` (React + Vite + TypeScript + Tailwind) and `server/` (Node.js + Express)
- Database: PostgreSQL + pgvector extension
- LLM: Multi-provider auto-failover — Groq → DeepSeek → Gemini (all free tiers)
- Embeddings: @xenova/transformers local model (all-MiniLM-L6-v2, 384-dim, no API cost)
- Deployment: Vercel (frontend) + Render (backend) + Neon (DB)

## Your task: Phase 1 — Foundation & Infrastructure

Generate ALL files listed below with complete, working code. Do not skip any file.

---

## STRICT ARCHITECTURE RULES
- Controllers = HTTP validation + delegate only. NO business logic.
- Services = ALL business logic.
- Repositories = DB queries ONLY. No logic.
- No hardcoded values. All config via environment variables.
- Every file that needs tests must have a test file.

---

## FOLDER STRUCTURE (LOCKED — do not change)

server/
├── src/
│   ├── controllers/         (empty in phase 1)
│   ├── services/            (empty in phase 1)
│   ├── repositories/        (empty in phase 1)
│   ├── routes/              (empty in phase 1)
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── middlewares/
│   │   └── error.middleware.js
│   ├── utils/
│   │   └── logger.js
│   ├── app.js
│   └── server.js
├── package.json
├── .env.example

client/
├── src/
│   ├── components/          (empty in phase 1)
│   ├── pages/               (empty in phase 1)
│   ├── services/
│   │   └── api.js
│   ├── hooks/               (empty in phase 1)
│   ├── utils/               (empty in phase 1)
│   ├── styles/
│   │   └── tokens.css
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.example

---

## SERVER: Generate these files

### server/package.json
Dependencies: express, pg, dotenv, cors, multer, module, helmet, express-async-errors
DevDependencies: jest, supertest, nodemon

### server/.env.example
```

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/knowbase
PORT=5000
NODE_ENV=development
# Add at least ONE LLM key — system auto-routes Groq → DeepSeek → Gemini
GROQ_API_KEY=your_groq_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

````

### server/src/config/env.js
- Import dotenv and call config()
- Always required: DATABASE_URL, PORT — throw Error with var name if missing
- LLM keys: require at least one of GROQ_API_KEY, DEEPSEEK_API_KEY, GEMINI_API_KEY
  — throw Error('At least one LLM API key required: GROQ_API_KEY | DEEPSEEK_API_KEY | GEMINI_API_KEY') if none set
- Export: DATABASE_URL, PORT, NODE_ENV, GROQ_API_KEY (or null), DEEPSEEK_API_KEY (or null), GEMINI_API_KEY (or null)

### server/src/config/db.js
- Create a pg Pool using DATABASE_URL from env
- Export a query(text, params) helper function
- Export the pool
- On connect error, log and exit process

### server/src/utils/logger.js
- Simple logger with info(msg), error(msg), warn(msg) methods
- Each method prefixes with timestamp + level
- Use console.log/error underneath

### server/src/middlewares/error.middleware.js
- Express global error handler (4 params: err, req, res, next)
- Log the error
- Return JSON: { error: err.message || "Internal server error" }
- Status: err.status || 500

### server/src/app.js
- Create Express app
- Apply: cors, express.json(), helmet
- Apply error middleware at the end
- Export app (do NOT start server here)

### server/src/server.js
- Import app and env config
- Call app.listen(PORT)
- Log "Server running on port PORT"

---

## DATABASE: Generate this file

### server/src/config/schema.sql
Complete SQL to set up the database from scratch:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  file_type  VARCHAR(10)  NOT NULL,
  file_size  INTEGER,
  status     VARCHAR(20)  NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER      NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content     TEXT         NOT NULL,
  chunk_index INTEGER      NOT NULL,
  embedding   VECTOR(768)  NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestions (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER      NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  question    TEXT         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_document_id ON suggestions(document_id);
````

---

## CLIENT: Generate these files

### client/package.json

Dependencies: react, react-dom, react-router-dom, axios, lucide-react
DevDependencies: vite, @vitejs/plugin-react, typescript, tailwindcss, autoprefixer, postcss, @types/react, @types/react-dom, jest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event

### client/vite.config.js

- React plugin
- Server proxy: /api → http://localhost:5000

### client/tailwind.config.js

- Content: ['./src/**/*.{js,jsx,ts,tsx}']
- No custom theme extensions needed — tokens are in CSS variables

### client/tsconfig.json

Standard React + Vite TypeScript config.

### client/.env.example

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### client/src/styles/tokens.css

Define ALL CSS custom properties:

```css
:root {
  /* Primary */
  --primary: #2563eb;
  --primary-light: #e6f1fb;
  --primary-dark: #0c447c;

  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f4;
  --bg-tertiary: #ededed;

  /* Text */
  --text-primary: #1a1a1a;
  --text-secondary: #6b6b6b;
  --text-tertiary: #9b9b9b;

  /* Borders */
  --border-default: rgba(0, 0, 0, 0.15);
  --border-hover: rgba(0, 0, 0, 0.3);

  /* Semantic */
  --error-bg: #fcebeb;
  --error-text: #a32d2d;
  --success-bg: #eaf3de;
  --success-text: #3b6d11;
  --warning-bg: #faeeda;
  --warning-text: #854f0b;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 40px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 50%;

  /* Typography */
  --font-sans:
    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Consolas", monospace;
}

.dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: #111111;
  --bg-tertiary: #2a2a2a;
  --text-primary: #f5f5f4;
  --text-secondary: #a0a0a0;
  --text-tertiary: #666666;
  --border-default: rgba(255, 255, 255, 0.12);
  --border-hover: rgba(255, 255, 255, 0.25);
}
```

### client/src/services/api.js

- Axios instance with baseURL from import.meta.env.VITE_API_BASE_URL
- Default headers: Content-Type: application/json
- Export the instance as default
- Export typed helper functions: uploadDocument(file), sendChat(query), getSuggestions(documentId)

### client/src/App.jsx

- React Router v6 setup
- Single route: "/" → renders placeholder div "Knowbase — Phase 1 complete"
- Import tokens.css

### client/src/main.jsx

- Standard React 18 createRoot entry point
- Import index.css and tokens.css

### client/src/index.css

- @tailwind base; @tailwind components; @tailwind utilities;
- Import tokens.css
- Set font-family to var(--font-sans) on body

---

## Docker setup

### docker-compose.yml (at repo root)

```yaml
version: "3.8"
services:
  db:
    image: ankane/pgvector
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: knowbase
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/src/config/schema.sql:/docker-entrypoint-initdb.d/schema.sql
volumes:
  postgres_data:
```

---

## EXIT CRITERIA CHECK

After generating all files, confirm:

1. `cd server && npm install && npm run dev` starts without errors
2. `cd client && npm install && npm run dev` starts without errors
3. `docker-compose up -d` starts the DB and runs schema.sql
4. Server connects to DB on startup (log "DB connected" or equivalent)

Generate all files now. Complete working code only — no pseudocode, no "fill this in later" comments.

```

---

## PHASE 2 PROMPT

```

You are continuing to build "Knowbase" — a personal document-based RAG search engine.
Phase 1 is complete: Express server running, React client running, PostgreSQL with pgvector set up, all 3 DB tables exist.

## Your task: Phase 2 — Document Upload & Processing Pipeline

Generate ALL files listed below with complete, working code. Do not skip any file. Do not modify any Phase 1 files unless absolutely necessary (and if you do, state exactly what changed and why).

---

## STRICT ARCHITECTURE RULES

- Controllers = validate request + delegate to service. NO business logic.
- Services = ALL business logic (extraction, chunking, embedding, LLM calls).
- Repositories = SQL queries ONLY. No business logic.
- No hardcoded values. All config via environment variables.
- Every service MUST have unit tests. Every component MUST have a test file.

---

## TECH STACK

- File upload: multer (already in package.json)
- PDF text extraction: pdf-parse
- DOCX text extraction: mammoth
- TXT: Node.js fs (built-in)
- Embeddings: @xenova/transformers (Xenova/all-MiniLM-L6-v2 model — outputs 384-dim, but we store as VECTOR(384) — use this model, it's the practical choice)

IMPORTANT: Use @xenova/transformers for embeddings. Update the DB schema column to VECTOR(384) to match. The scoring-engine-spec says 768 but @xenova/transformers all-MiniLM-L6-v2 outputs 384. Use 384.

- LLM for suggestions: llm.service.js (multi-provider — do NOT call groq-sdk directly)
- DB: pg (already set up in db.js)

---

## SERVER FILES TO GENERATE

### server/package.json (update — add new deps)

Add: pdf-parse, mammoth, @xenova/transformers, groq-sdk, openai, @google/generative-ai, uuid

### server/src/config/providers.js (NEW — already created in Phase 1 update)

Export:
- PROVIDER_PRIORITY = ['groq', 'deepseek', 'gemini']
- PROVIDER_MODELS = { groq: 'llama3-8b-8192', deepseek: 'deepseek-chat', gemini: 'gemini-1.5-flash' }
- COOLDOWN_MS = 60_000
- isProviderConfigured(name) — returns true if that provider's API key is in env

### server/src/services/llm.service.js (NEW — already created in Phase 1 update)

Export:
- llmChat(messages, options?) → Promise<{ content: string, provider: string }>
  - Tries providers in priority order: groq → deepseek → gemini
  - 429 → mark provider on 60s cooldown → try next
  - Other error → skip for this request → try next
  - All fail → throw Error('All configured LLM providers failed')
- getProviderStatus() → Array<{ name, configured, available, cooldownUntil }>

Callers:
- callGroq: uses groq-sdk with GROQ_API_KEY
- callDeepSeek: uses openai package with baseURL='https://api.deepseek.com' and DEEPSEEK_API_KEY
- callGemini: uses @google/generative-ai with GEMINI_API_KEY; flatten system+user messages into single prompt

### server/src/utils/chunking.js

Function: chunkText(text, maxTokens = 600, overlap = 100)

- Approximate tokens as words (1 word ≈ 1.3 tokens)
- Split text by sentences first (split on '. ', '? ', '! ')
- Accumulate sentences into chunks until maxTokens reached
- Apply overlap: last N words of previous chunk prepended to next chunk
- Return: Array of { content: string, chunkIndex: number }
- Handle edge cases: empty text returns [], text shorter than maxTokens returns single chunk

### server/tests/unit/utils/chunking.test.js

Tests:

- Returns empty array for empty string
- Returns single chunk for short text
- Returns multiple chunks for long text
- Each chunk content is a non-empty string
- Chunk indices are sequential starting at 0
- Overlap: last words of chunk N appear at start of chunk N+1

### server/src/services/document.service.js

Functions:

- extractText(fileBuffer, mimeType): Promise<string>
  - 'application/pdf' → pdf-parse
  - 'application/vnd.openxmlformats...' → mammoth.extractRawText
  - 'text/plain' → fileBuffer.toString('utf-8')
  - Throws Error('Empty document') if result is empty/whitespace
- chunkText(text): Array<{content, chunkIndex}>
  - Calls chunking.js chunkText()

### server/tests/unit/services/document.service.test.js

Tests (mock pdf-parse and mammoth):

- extractText: returns string for PDF mime type
- extractText: returns string for DOCX mime type
- extractText: returns string for TXT mime type
- extractText: throws 'Empty document' for empty result
- chunkText: returns array of chunks
- chunkText: each chunk has content and chunkIndex

### server/src/services/embedding.service.js

Functions:

- loadModel(): Promise<void> — load @xenova/transformers pipeline once (singleton)
- generateEmbedding(text): Promise<number[]> — returns float32 array of length 384
- generateEmbeddings(texts): Promise<number[][]> — batch version

Implementation:

```js
import { pipeline } from "@xenova/transformers";

let embedder = null;

async function loadModel() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
}

async function generateEmbedding(text) {
  await loadModel();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
```

### server/tests/unit/services/embedding.service.test.js

Tests (mock @xenova/transformers):

- generateEmbedding returns an array
- generateEmbedding array length is 384
- generateEmbedding called with text string
- loadModel is only called once (singleton pattern)

### server/src/services/suggestion.service.js

Functions:

- generateSuggestions(documentName, summary): Promise<string[]>
  - Import { llmChat } from './llm.service.js' — do NOT use groq-sdk directly
  - messages = [
      { role: 'system', content: 'You generate search questions from document summaries.' },
      { role: 'user', content: `Given this document summary, generate exactly 3 concise questions a user might ask. Return ONLY a JSON array of 3 strings, no explanation.\n\nSummary: ${summary}` }
    ]
  - const { content } = await llmChat(messages, { maxTokens: 256 })
  - Parse JSON array from content string
  - Return array of 3 question strings
  - On llmChat failure: throw Error('Suggestion generation failed')

### server/tests/unit/services/suggestion.service.test.js

Tests (mock llm.service.js, NOT groq-sdk):

- Returns array of 3 strings
- Each string is non-empty
- Throws 'Suggestion generation failed' when llmChat throws
- Calls llmChat with messages array containing system + user roles

### server/src/repositories/document.repository.js

Functions (all use the db.js query helper):

- insertDocument(name, fileType, fileSize): Promise<{id}>
- updateDocumentStatus(id, status): Promise<void>
- insertChunk(documentId, content, chunkIndex, embedding): Promise<void>
  — embedding is a number[] — convert to pgvector format: '[' + embedding.join(',') + ']'
- insertSuggestion(documentId, question): Promise<void>
- getDocumentById(id): Promise<document | null>
- getAllDocuments(): Promise<document[]>
- getSuggestionsByDocumentId(documentId): Promise<suggestion[]>
- getChunksByDocumentId(documentId): Promise<chunk[]>

### server/src/controllers/upload.controller.js

Handler: uploadDocument(req, res, next)

- Validate: file exists (multer req.file) → 400 if missing
- Validate: mimetype is pdf/docx/txt → 400 if not
- Validate: file size ≤ 10MB → 400 if over
- Call documentService.extractText(req.file.buffer, req.file.mimetype)
- Call documentService.chunkText(text)
- Insert document record (status: 'processing')
- For each chunk: call embeddingService.generateEmbedding(chunk.content)
- Insert each chunk+embedding to DB
- Generate summary (first 1000 chars of text)
- Call suggestionService.generateSuggestions(documentName, summary)
- Insert suggestions to DB
- Update document status to 'ready'
- Return 200: { documentId, name, status: 'ready', chunkCount, suggestions }
- On any error: update document status to 'failed', pass to next(err)

### server/src/routes/upload.routes.js

- Mount multer with memoryStorage, limits: fileSize 10MB
- POST /api/upload → uploadDocument controller
- Export router

### server/src/app.js (update)

- Add: import uploadRoutes and mount at /api

### server/tests/integration/upload.test.js

Use supertest. Tests:

- POST /api/upload with no file → 400
- POST /api/upload with wrong file type → 400
- POST /api/upload with valid TXT file containing text → 200, returns documentId + suggestions
- POST /api/upload with empty TXT file → 400
  (Mock embeddingService and suggestionService in integration tests to avoid real API calls)

---

## CLIENT FILES TO GENERATE

### client/src/components/Upload/Upload.jsx

Complete React component:

- Drag-and-drop zone + "Browse files" button
- Accept: .pdf, .docx, .txt
- Client-side validation: type check, size check (10MB)
- State: idle | uploading | processing | ready | error
- Show status transitions with appropriate UI:
  - uploading: progress spinner + "Uploading..."
  - processing: spinner + "Processing..."
  - ready: checkmark + "Ready to search" + document name
  - error: red indicator + error message + "Retry" button
- On success: call onUploadSuccess(response) prop
- On file selected: call POST /api/upload via api.js uploadDocument()
- Use CSS tokens (var(--primary), var(--error-bg), etc.) — no raw hex values
- Use data-testid attributes: upload-zone, file-input, status-indicator, retry-button

### client/src/components/Upload/Upload.test.jsx

Tests using React Testing Library:

- Renders upload zone
- Renders browse button
- Shows error for unsupported file type
- Shows error for file > 10MB
- Shows uploading state while request in flight (mock api)
- Shows ready state on success (mock api)
- Shows error state on failure (mock api)
- Retry button appears on error
- Calls onUploadSuccess with response data on success

---

## EXIT CRITERIA CHECK

After generating all files, confirm:

1. `cd server && npm test` — all unit tests pass
2. Integration test for POST /api/upload passes with a real .txt file
3. Upload component renders without errors
4. Uploading a .txt file through the UI triggers status transitions

Generate all files now. Complete working code only — no pseudocode, no placeholder comments.

```

---

## PHASE 3 PROMPT

```

You are continuing to build "Knowbase" — a personal document-based RAG search engine.
Phase 1 is complete: server + client infrastructure, DB schema set up.
Phase 2 is complete: upload pipeline working — file → text → chunks → embeddings → DB → suggestions.

## Your task: Phase 3 — Chat / RAG Query Pipeline

Generate ALL files listed below with complete, working code. Do not skip any file. Do not modify Phase 1 or Phase 2 files unless absolutely necessary.

---

## STRICT ARCHITECTURE RULES

- Controllers = validate request + delegate. NO business logic.
- Services = ALL business logic (embedding, search, LLM prompt building).
- Repositories = SQL queries ONLY.
- No hardcoded values. All config via env vars.
- RAG ONLY — the LLM must ONLY answer from retrieved document chunks. No general knowledge.

---

## TECH STACK CONTEXT

- Embeddings: @xenova/transformers, Xenova/all-MiniLM-L6-v2, outputs 384-dim vectors
- Vector search: pgvector with `<=>` cosine distance operator, top-k=5
- LLM: llm.service.js with auto-failover — Groq (primary) → DeepSeek → Gemini. Do NOT import groq-sdk, openai, or @google/generative-ai directly in controllers/services other than llm.service.js
- DB: existing pg setup (db.js query helper)

---

## SERVER FILES TO GENERATE

### server/src/services/search.service.js

Functions:

- similaritySearch(queryVector): Promise<chunk[]>
  - queryVector is number[] of length 384
  - SQL query:
    ```sql
    SELECT
      dc.id AS chunk_id,
      dc.document_id,
      dc.content,
      dc.chunk_index,
      d.name AS document_name,
      1 - (dc.embedding <=> $1::vector) AS similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    ORDER BY dc.embedding <=> $1::vector
    LIMIT 5
    ```
  - Parameter: '[' + queryVector.join(',') + ']' (pgvector format)
  - Returns array of { chunkId, documentId, documentName, content, similarity }

### server/tests/unit/services/search.service.test.js

Tests (mock db query):

- Returns array of chunks
- Returns at most 5 results
- Each result has chunkId, documentId, documentName, content, similarity
- Returns empty array when no chunks in DB
- Calls query with correct SQL structure

### server/src/controllers/chat.controller.js

Handler: sendMessage(req, res, next)

- Validate: req.body.query exists and is non-empty string → 400 if not
- Call embeddingService.generateEmbedding(query) → queryVector
- Call searchService.similaritySearch(queryVector) → chunks
- If chunks is empty:
  return 200: { answer: "No relevant data found in your documents.", sources: [] }
- Build LLM prompt:

  ```
  System: "You are a precise assistant. Answer ONLY using the provided context below.
  If the context does not contain enough information to answer, say exactly:
  'No relevant data found in your documents.'
  Do not use any knowledge outside the provided context."

  Context:
  [1] (documentName)
  content

  [2] (documentName)
  content

  ... (up to 5)

  User: {query}
  ```

- Call llmChat (from llm.service.js — do NOT use groq-sdk directly):
  - import { llmChat } from '../services/llm.service.js'
  - messages: [{role: 'system', content: systemPrompt}, {role: 'user', content: query}]
  - llm.service.js handles provider auto-switching internally — no retry logic needed here
  - On llmChat failure: call next(err) with status 503
- Return 200:
  ```json
  {
    "answer": "...",
    "sources": [
      {
        "documentId": 1,
        "documentName": "notes.pdf",
        "chunkId": 5,
        "content": "...",
        "similarity": 0.87
      }
    ]
  }
  ```

### server/src/controllers/suggestion.controller.js

Handler: getSuggestions(req, res, next)

- Validate: req.query.documentId exists → 400 if missing
- Parse documentId as integer → 400 if NaN
- Call documentRepository.getDocumentById(documentId) → 404 if not found
- Call documentRepository.getSuggestionsByDocumentId(documentId)
- Return 200: { documentId, suggestions: [{id, question}] }

### server/src/routes/chat.routes.js

- POST /api/chat → sendMessage controller
- Export router

### server/src/routes/suggestion.routes.js

- GET /api/suggestions → getSuggestions controller
- Export router

### server/src/app.js (update)

Add mount for chatRoutes at /api and suggestionRoutes at /api.

### server/tests/integration/chat.test.js

Tests (mock embeddingService and Groq, use real DB with test fixtures):

- POST /api/chat with no query → 400
- POST /api/chat with empty query → 400
- POST /api/chat with valid query + no chunks in DB → 200, answer is "No relevant data found"
- POST /api/chat with valid query + chunks in DB → 200, returns answer + sources array
- POST /api/chat when llmChat throws (all providers fail) → 503

### server/tests/integration/suggestion.test.js

Tests:

- GET /api/suggestions with no documentId → 400
- GET /api/suggestions with non-numeric documentId → 400
- GET /api/suggestions with valid documentId but no document → 404
- GET /api/suggestions with valid documentId → 200, returns suggestions array

---

## CLIENT FILES TO GENERATE

### client/src/services/api.js (update — add missing functions if not already present)

Ensure these functions exist:

- uploadDocument(file): POST /api/upload with FormData
- sendChat(query): POST /api/chat with { query }
- getSuggestions(documentId): GET /api/suggestions?documentId=documentId

### client/src/components/Suggestions/Suggestions.jsx

Props: onSuggestionClick(questionText)

- Fetch suggestions from GET /api/suggestions?documentId when documentId prop changes
- Render each suggestion as a clickable pill
- Pill styles: border 0.5px solid var(--border-default), border-radius 20px, padding 6px 14px, font-size 12px, color var(--text-secondary)
- Hover: background var(--bg-secondary)
- On click: call onSuggestionClick(question)
- If no suggestions: render nothing (null)
- data-testid: suggestion-pill, suggestions-container

### client/src/components/Suggestions/Suggestions.test.jsx

Tests:

- Renders nothing when no suggestions
- Renders suggestion pills for each suggestion
- Clicking a pill calls onSuggestionClick with question text
- Fetches from correct API endpoint

### client/src/components/Chat/Chat.jsx

Complete chat component. This is the core UI component.

State:

- messages: Array<{ id, role: 'user'|'assistant', content, sources?, searchStatus? }>
- inputValue: string
- isLoading: boolean

Layout (full height flex column):

```
┌──────────────────────────────────┐
│  Message Area (flex-grow, scroll) │
│  ├── [User message bubble]        │
│  ├── [Search status line]         │
│  ├── [AI response text]           │
│  └── [Citation pills]             │
└──────────────────────────────────┘
│  Input Bar (pinned bottom)        │
└──────────────────────────────────┘
```

User message bubble:

- Background: var(--primary)
- Color: white
- Border radius: 16px 16px 4px 16px
- Max-width: 420px, align: flex-end
- Font size: 14px, padding: 12px 16px

AI response (no bubble):

- Background: none
- Color: var(--text-primary)
- Max-width: 520px, align: flex-start
- Font size: 14px, line-height: 1.7

Search status indicator (shown between user msg and AI response while loading):

- "Searching your documents..." with animated spinner (CSS animation)
- Color: var(--primary), font-size: 12px

Citation pills (below AI response):

- Render sources as pills
- Same-document (group by documentId): background var(--primary-light), text var(--primary-dark)
- Cross-document: background #E1F5EE, text #085041
- Format: "[N documentName]"
- Padding: 4px 10px, border-radius: 6px, font-size: 11px

Input bar:

- Textarea (auto-resize, max 5 lines)
- Enter sends, Shift+Enter newlines
- Send button: 32px circle, var(--primary) background, white arrow icon (Lucide SendHorizontal)
- Disabled + 40% opacity when input empty or loading
- Border: 0.5px solid var(--border-hover), border-radius: 16px

On send:

1. Add user message immediately to messages state
2. Set isLoading = true
3. Add placeholder assistant message with searchStatus: "Searching your documents..."
4. Call api.sendChat(query)
5. Replace placeholder with real answer + sources
6. Set isLoading = false

Landing state (when messages is empty):

- Center in available space
- Brand icon: 48px, Lucide Search with var(--primary) color
- Heading: "What do you want to know?" — 22px, weight 500
- Subtitle: "Search across your documents..." — 14px, var(--text-secondary)
- Search bar (same input bar)
- Suggestions component below search bar
- Keyboard hint at bottom: "Press / to focus search" — 12px, var(--text-tertiary)

data-testid: chat-container, message-input, send-button, user-message, ai-response, citation-pill, search-status, landing-view

### client/src/components/Chat/Chat.test.jsx

Tests:

- Renders landing view when no messages
- Renders search bar
- Typing in input updates state
- Pressing Enter calls sendChat API (mock)
- User message appears immediately (before API responds)
- Search status shows while loading
- AI response renders after API responds
- Citation pills render with correct document names
- Send button disabled when input empty

### client/src/pages/ChatPage.jsx

- Import and render Chat component
- Import Upload component
- Pass onUploadSuccess handler from Upload to Chat (so new document triggers suggestion refresh)
- data-testid: chat-page

### client/src/pages/ChatPage.test.jsx

Tests:

- Renders without crashing
- Contains Chat component
- Contains Upload component

---

## EXIT CRITERIA CHECK

After generating all files, confirm:

1. `cd server && npm test` — all unit + integration tests pass
2. POST /api/chat with a real query returns answer + sources
3. GET /api/suggestions with valid documentId returns suggestions
4. Chat UI renders landing state, allows typing, shows messages
5. Citation pills render below AI responses

Generate all files now. Complete working code only — no pseudocode, no "TODO" comments.

```

---

## PHASE 4 PROMPT

```

You are completing "Knowbase" — a personal document-based RAG search engine.
Phases 1, 2, 3 are complete:

- Phase 1: Infrastructure (server, client, DB)
- Phase 2: Upload pipeline (file → chunks → embeddings → DB → suggestions)
- Phase 3: RAG query pipeline (query → vector search → LLM answer → citations in UI)

## Your task: Phase 4 — Sidebar, Polish, E2E Tests & Deployment Config

Generate ALL files listed below with complete, working code. Do not skip any file.

---

## STRICT ARCHITECTURE RULES

- No new API endpoints needed in this phase — UI only + E2E tests + deployment config
- Use CSS tokens (var(--primary), etc.) — no raw hex values in components
- Keyboard shortcuts must be global (attached to document, cleaned up on unmount)
- All animations must be CSS transitions only — no JS animation libraries
- Maximum animation duration: 300ms

---

## UI DESIGN TOKENS (already in tokens.css — reference only)

Primary: #2563EB | Primary light: #E6F1FB | Primary dark: #0C447C
BG primary: #FFFFFF | BG secondary: #F5F5F4 | BG tertiary: #EDEDED
Text primary: #1A1A1A | Text secondary: #6B6B6B | Text tertiary: #9B9B9B
Error bg: #FCEBEB | Success bg: #EAF3DE | Warning bg: #FAEEDA

---

## CLIENT FILES TO GENERATE

### client/src/components/shared/Toast.jsx

Props: { message, type: 'error'|'success'|'warning', onDismiss }

- Appears at top-right of screen (position: fixed, top: 16px, right: 16px)
- Auto-dismiss after 5 seconds (call onDismiss after 5s)
- Slide down + fade in animation (CSS transition)
- Background color based on type (use semantic tokens)
- Close button (×)
- data-testid: toast, toast-dismiss

### client/src/components/shared/Badge.jsx

Props: { type: 'pdf'|'docx'|'txt', children }
File type badge colors:

- pdf: background #F0997B33, color #993C1D
- docx: background #85B7EB33, color #185FA5
- txt: background #97C45933, color #3B6D11
  Border-radius: 3px, font-size: 11px, font-weight: 500, padding: 2px 6px
  data-testid: file-badge

### client/src/components/shared/Avatar.jsx

Props: { initials, size: 'sm'|'md' }

- sm = 30px, md = 32px
- Background: var(--primary), color: white
- Border-radius: 50%
- Font: 12px, weight 500, uppercase
- data-testid: avatar

### client/src/components/Sidebar/Sidebar.jsx

Full sidebar component. Props: { chats, activeChat, onChatSelect, onNewChat, documents }

Structure:

```
├── Header (logo + NewChat button)
├── Separator
├── Chat history section
│   ├── "CHATS" label (11px, uppercase, var(--text-tertiary))
│   ├── Chat list grouped by date
│   │   ├── Date label: "TODAY" / "YESTERDAY" / "THIS WEEK" / "EARLIER"
│   │   └── Chat items
└── Documents section
    ├── "DOCUMENTS" label
    └── Document items (name + Badge)
```

Chat history item:

- Default: transparent bg, var(--text-primary)
- Hover: var(--bg-secondary) bg
- Active: var(--bg-secondary) bg, title color var(--primary)
- Padding: 8px 12px, border-radius: var(--radius-md), font-size: 13px
- Truncate long titles with ellipsis

Date grouping logic:

- Group chats by: today, yesterday, this week, earlier
- Show group label in uppercase, 11px, var(--text-tertiary)

New Chat button:

- 28px × 28px, border: 0.5px solid var(--border-default), border-radius: var(--radius-md)
- Plus icon (Lucide Plus, 14px, var(--text-secondary))
- Hover: var(--bg-secondary)

Document items:

- File name (truncated) + Badge component for file type
- font-size: 13px, padding: 6px 12px

Empty states:

- No chats: "No conversations yet. Ask your first question." centered, var(--text-tertiary)
- No documents: "No documents uploaded yet." centered, var(--text-tertiary)

Responsive: At < 768px, sidebar should be hideable via a toggle (isOpen prop).

data-testid: sidebar, new-chat-button, chat-history-item, document-list-item, date-group-label

### client/src/components/Sidebar/Sidebar.test.jsx

Tests:

- Renders with no chats → shows empty state message
- Renders with no documents → shows empty state message
- Renders chat items in correct date groups
- Active chat item has active styling class
- Clicking chat item calls onChatSelect
- Clicking new chat button calls onNewChat
- Document items show correct file type badge

### client/src/pages/ChatPage.jsx (full replacement — composing all components)

Full page layout:

```
┌─────────────────────────────────────────────────┐
│ AppShell (display: flex, height: 100vh)          │
│  ┌─────────┬───────────────────────────────────┐ │
│  │ Sidebar │  Main Content Area                │ │
│  │  260px  │  flex: 1                          │ │
│  └─────────┴───────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

State managed in ChatPage:

- chats: Chat[] (stored in localStorage for persistence)
- activeChat: Chat | null
- documents: Document[] (fetched from DB or stored locally from upload responses)
- toast: { message, type } | null

Props passed down:

- Sidebar: chats, activeChat, onChatSelect, onNewChat, documents
- Chat: activeChat, onMessageSent (update chats state), onUploadSuccess

Keyboard shortcuts (global, via useEffect + cleanup):

- '/' → focus the chat search input (document.querySelector('[data-testid="message-input"]').focus())
- 'Ctrl+N' → call onNewChat
- 'Escape' → blur focused input

Error display:

- Upload errors → show Toast (error type, 5s)
- Network errors → show persistent banner below chat header

### client/src/pages/ChatPage.test.jsx

Tests:

- Renders Sidebar component
- Renders Chat component
- Keyboard shortcut / focuses input
- Ctrl+N triggers new chat state
- Toast appears on upload error
- Toast auto-dismisses

### client/src/components/Chat/Chat.jsx (update for error + loading states)

Add to existing Chat component:

- Loading skeleton while AI responds: 3 lines at 100%, 85%, 60% width pulsing var(--bg-secondary)
- Error state for no results: inline message styled with var(--error-bg) / var(--error-text)
- Network error detection: show "Connection issue. Please try again." inline

---

## E2E TESTS (Playwright)

### client/tests/e2e/upload.spec.js

```js
// Assumes app is running at http://localhost:5173
// Assumes server is running at http://localhost:5000
// Test fixtures: client/tests/e2e/fixtures/sample.txt (create this too)

test('upload flow: txt file → status transitions → appears in sidebar')
Steps:
1. Navigate to http://localhost:5173
2. Find the upload zone (data-testid="upload-zone")
3. Upload sample.txt via setInputFiles
4. Assert: status indicator text contains "Uploading"
5. Assert: status indicator eventually contains "Ready"
6. Assert: sidebar document list contains "sample.txt"
7. Assert: file badge with "TXT" is visible

test('upload error: unsupported file type')
Steps:
1. Navigate to app
2. Try to upload a .exe file
3. Assert: error message visible (data-testid="status-indicator" contains "not supported")

test('upload error: file too large')
Steps:
1. Navigate to app
2. Mock or create a file > 10MB
3. Assert: error message about size limit
```

### client/tests/e2e/suggestions.spec.js

```js
test('suggestions appear after upload and clicking populates search bar')
Steps:
1. Navigate to app
2. Upload sample.txt
3. Wait for "Ready" status
4. Assert: at least 1 suggestion pill visible (data-testid="suggestion-pill")
5. Click first suggestion pill
6. Assert: message input (data-testid="message-input") value equals the suggestion text
```

### client/tests/e2e/chat.spec.js

```js
test('query → AI response with citation pills')
Steps:
1. Navigate to app
2. Upload sample.txt and wait for "Ready"
3. Type a question in data-testid="message-input"
4. Press Enter
5. Assert: user message visible (data-testid="user-message") with question text
6. Assert: search status visible (data-testid="search-status")
7. Assert: AI response visible (data-testid="ai-response") — wait up to 15s
8. Assert: at least 1 citation pill visible (data-testid="citation-pill")

test('no match: returns no relevant data message')
Steps:
1. Navigate to app
2. Type a completely unrelated question (e.g. "What is the capital of Mars?")
3. Press Enter
4. Assert: AI response contains "No relevant data"

test('keyboard shortcut: / focuses input')
Steps:
1. Navigate to app
2. Click elsewhere to remove focus
3. Press / key
4. Assert: message-input is focused (document.activeElement)
```

### client/tests/e2e/fixtures/sample.txt

Content:

```
Knowbase is a personal knowledge search engine.
It uses RAG (Retrieval-Augmented Generation) to answer questions from uploaded documents.
The system extracts text from PDF, DOCX, and TXT files.
Text is split into chunks and stored as vector embeddings in PostgreSQL using pgvector.
When a user asks a question, the system finds the most similar chunks and sends them to an LLM.
The LLM generates an answer based only on the retrieved content.
This ensures all answers are grounded in the uploaded documents.
```

### client/playwright.config.js

```js
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },
  webServer: [
    {
      command: "npm run dev",
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
```

---

## DEPLOYMENT CONFIG FILES

### vercel.json (at client/ root)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### render.yaml (at server/ root — for Render deploy)

```yaml
services:
  - type: web
    name: knowbase-api
    env: node
    buildCommand: npm install
    startCommand: node src/server.js
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: GROQ_API_KEY
        sync: false
      - key: DEEPSEEK_API_KEY
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: PORT
        value: 5000
      - key: NODE_ENV
        value: production
```

### README.md (at repo root)

Include:

- Project overview (1 paragraph)
- Tech stack table
- Local development setup (step by step: Docker DB, server, client)
- Environment variables table for both client and server
- How to run tests (server unit, server integration, client component, E2E)
- Deployment instructions (Neon → Render → Vercel)

---

## EXIT CRITERIA CHECK

After generating all files, confirm:

1. Sidebar renders with chat history and documents
2. Keyboard shortcuts (/, Ctrl+N, Esc) work
3. Toast component appears and auto-dismisses
4. All component tests pass (`npm test` in client)
5. Playwright E2E: all 3 spec files pass with the real running app
6. Deployment config files exist for Vercel and Render

Generate all files now. Complete working code only — no pseudocode, no "TODO" comments.

```

```

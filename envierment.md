# Environment Configuration

## Overview

The project uses two separate environment files:
- `client/.env` — frontend environment variables (Vite)
- `server/.env` — backend environment variables (Node.js)

**Rule:** Never hardcode secrets or configuration values. All environment-specific values must come from these files.

---

## Server Environment Variables

### `server/.env`

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/knowbase

# Server
PORT=5000
NODE_ENV=development

# LLM Providers — add at least ONE key.
# System auto-routes: Groq → DeepSeek → Gemini (priority order).
# On 429 rate-limit the provider cools down 60s and the next is tried.

# Groq (fastest, free 30 RPM) — https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# DeepSeek (free tier) — https://platform.deepseek.com
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Google Gemini Flash (free 15 RPM / 1500 RPD) — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable         | Required          | Description                                        |
| ---------------- | ----------------- | -------------------------------------------------- |
| DATABASE_URL     | Yes               | Full PostgreSQL connection string                  |
| PORT             | Yes               | Port the Express server listens on (default: 5000) |
| NODE_ENV         | No                | `development` or `production`                      |
| GROQ_API_KEY     | At least one LLM  | API key from console.groq.com                      |
| DEEPSEEK_API_KEY | At least one LLM  | API key from platform.deepseek.com                 |
| GEMINI_API_KEY   | At least one LLM  | API key from aistudio.google.com                   |

> **Rule:** At least one of `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY` must be set. Server fails fast on startup otherwise.

---

## LLM Provider Auto-Switching

All LLM calls route through `server/src/services/llm.service.js`:

| Priority | Provider  | Model              | Free Limits         |
| -------- | --------- | ------------------ | ------------------- |
| 1        | Groq      | llama3-8b-8192     | 30 RPM / 14,400 RPD |
| 2        | DeepSeek  | deepseek-chat      | ~60 RPM (free tier) |
| 3        | Gemini    | gemini-1.5-flash   | 15 RPM / 1,500 RPD  |

**Switching logic:**
- Try Groq first (fastest inference)
- On `429` → 60s cooldown → try DeepSeek
- On DeepSeek `429` → try Gemini
- Non-rate-limit errors → skip provider for current request only
- All fail → 503

---

## Client Environment Variables

### `client/.env`

```env
# API
VITE_API_BASE_URL=http://localhost:5000/api
```

| Variable           | Required | Description                            |
| ------------------ | -------- | -------------------------------------- |
| VITE_API_BASE_URL  | Yes      | Base URL for all Axios API calls       |

**Note:** Vite requires all custom env variables to be prefixed with `VITE_` to be exposed to the browser.

---

## Local Development Setup

### Prerequisites

- Node.js >= 18
- Docker (for local PostgreSQL)
- A Groq API key (free at console.groq.com)

### Step 1 — Start the Database

```bash
docker run \
  --name knowbase-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=knowbase \
  -p 5432:5432 \
  -d ankane/pgvector
```

Use `ankane/pgvector` image (includes pgvector pre-installed) instead of plain `postgres:15`.

### Step 2 — Run Database Migrations

Connect to the DB and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  file_type  VARCHAR(10)  NOT NULL,
  file_size  INTEGER,
  status     VARCHAR(20)  NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE document_chunks (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER     NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  chunk_index INTEGER     NOT NULL,
  embedding   VECTOR(768) NOT NULL
);

CREATE TABLE suggestions (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER  NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  question    TEXT     NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_suggestions_document_id ON suggestions(document_id);
```

### Step 3 — Start the Backend

```bash
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev
```

Backend runs at: `http://localhost:5000`

### Step 4 — Start the Frontend

```bash
cd client
cp .env.example .env   # set VITE_API_BASE_URL
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Production Environment

### Neon (Database)

1. Create a Neon project at neon.tech
2. Enable pgvector extension in Neon console
3. Run the schema migrations above against the Neon connection string
4. Copy the connection string as `DATABASE_URL` in Render env vars

### Render (Backend)

Environment variables to set in Render dashboard:

```
DATABASE_URL=<neon_connection_string>
GROQ_API_KEY=<your_groq_api_key>
PORT=5000
NODE_ENV=production
```

### Vercel (Frontend)

Environment variable to set in Vercel dashboard:

```
VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api
```

---

## Environment Validation

`server/src/config/env.js` must validate required variables on startup:

```js
const required = ['DATABASE_URL', 'GROQ_API_KEY', 'PORT'];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

If any required variable is missing, the server must fail fast with a clear error message — not silently break at runtime.

---

## .gitignore Rules

Both `.env` files must be in `.gitignore`:

```
client/.env
server/.env
.env
```

Provide `.env.example` files with placeholder values for documentation:

- `client/.env.example`
- `server/.env.example`

# Knowbase

A personal knowledge search engine that lets you upload documents and ask natural-language questions. Powered by RAG (Retrieval-Augmented Generation): your files are chunked, embedded into a vector database, and retrieved at query time so the LLM answers only from your content.

---

## Tech Stack

| Layer        | Technology                                  |
|-------------|----------------------------------------------|
| Frontend     | React 18, Vite, Tailwind CSS                |
| Backend      | Node.js, Express                            |
| Database     | PostgreSQL + pgvector (via Docker)          |
| Embeddings   | `@xenova/transformers` (all-MiniLM-L6-v2)  |
| LLM          | Groq → DeepSeek → Gemini (failover chain)  |
| Testing      | Jest + React Testing Library, Playwright    |
| Deployment   | Vercel (client), Render (server)            |

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- Docker Desktop

### 1. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL with pgvector on port **5433**.

### 2. Configure server environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in your API keys (see table below).

### 3. Install dependencies and start the server

```bash
cd server
npm install
npm run dev
```

Server runs at `http://localhost:5000`.

### 4. Install dependencies and start the client

```bash
cd client
npm install
npm run dev
```

Client runs at `http://localhost:5173`.

---

## Environment Variables

### Server (`server/.env`)

| Variable        | Required | Description                                      |
|----------------|----------|--------------------------------------------------|
| `DATABASE_URL`  | Yes      | PostgreSQL connection string (port 5433 locally) |
| `GROQ_API_KEY`  | Yes      | Primary LLM provider                            |
| `DEEPSEEK_API_KEY` | No    | Fallback LLM provider                           |
| `GEMINI_API_KEY` | No      | Second fallback LLM provider                    |
| `PORT`          | No       | HTTP port (default: 5000)                        |
| `NODE_ENV`      | No       | `development` or `production`                   |

### Client (`client/.env`)

| Variable              | Description                        |
|----------------------|------------------------------------|
| `VITE_API_BASE_URL`  | Server URL (default: `http://localhost:5000/api`) |

---

## Running Tests

### Server — unit tests
```bash
cd server && npm test
```

### Server — integration tests
```bash
cd server && npm run test:integration
```

### Client — component tests
```bash
cd client && npm test
```

### E2E — Playwright (requires both servers running)
```bash
# Install Playwright browsers once
cd client && npx playwright install

# Run E2E tests
npm run test:e2e
```

---

## Deployment

### Database → Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Run the schema: `psql <connection_string> -f server/src/config/schema.sql`

### Server → Render

1. Connect your GitHub repo to [render.com](https://render.com)
2. Use `server/render.yaml` as the service definition
3. Set the environment variables (`DATABASE_URL`, `GROQ_API_KEY`, etc.) in the Render dashboard

### Client → Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `client`
3. Set `VITE_API_BASE_URL` to your Render server URL
4. Deploy — `client/vercel.json` handles SPA routing automatically

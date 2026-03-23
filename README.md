# Recall — Personal Knowledge Search Engine

> Chat with your documents using AI. Upload PDFs and Word files, ask questions in natural language, and get answers with cited sources.

**Live Demo:** [https://personal-knowledge-search-engine.vercel.app](https://personal-knowledge-search-engine.vercel.app)

---

## What is Recall?

Recall is a full-stack RAG (Retrieval-Augmented Generation) application that lets you upload documents and have AI-powered conversations about their content. Instead of manually searching through files, you simply ask questions and the system finds the relevant passages and generates accurate answers.

---

## Features

- **Document Upload** — supports PDF and DOCX files
- **AI Chat** — ask questions about any uploaded document in natural language
- **Source Citations** — every answer shows which chunks of text it was drawn from
- **Smart Suggestions** — auto-generated questions for each document to help you get started
- **Multi-LLM Routing** — automatically routes between Groq → DeepSeek → Gemini with rate-limit fallback
- **Full Auth System** — register, login, logout, forgot password, reset password via email link
- **JWT Sessions** — short-lived access tokens (15 min) + long-lived refresh tokens (7 days) with auto-rotation
- **Chat History** — all conversations are persisted per user

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Tailwind CSS | Styling |
| Axios | HTTP client with auto-refresh interceptor |
| Vite | Build tool |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| `@xenova/transformers` | Local sentence embeddings (`all-MiniLM-L6-v2`, 384-dim) |
| `pg` (node-postgres) | Database client |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT access & refresh tokens |
| `resend` | Transactional email (password reset) |
| `mammoth` | DOCX → plain text extraction |
| `pdf-parse` | PDF → plain text extraction |
| `helmet` + `cors` | Security headers & CORS |

### AI / LLM Providers
| Provider | Model | Notes |
|----------|-------|-------|
| Groq | `llama-3.1-8b-instant` | Primary (fastest, 30 RPM free) |
| DeepSeek | `deepseek-chat` | Fallback #1 |
| Google Gemini | `gemini-1.5-flash` | Fallback #2 (15 RPM free) |

The system auto-routes between providers — if one hits a rate limit (429), it cools down for 60 seconds and the next provider is tried automatically.

### Database
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| `pgvector` extension | Vector similarity search for embeddings |

---

## How It Works

```
User uploads document
        ↓
Text extracted (PDF/DOCX parser)
        ↓
Text split into overlapping chunks
        ↓
Each chunk embedded → 384-dim vector (local model, no API cost)
        ↓
Chunks + embeddings stored in PostgreSQL with pgvector
        ↓
User asks a question
        ↓
Question embedded → cosine similarity search → top-k chunks retrieved
        ↓
Chunks + question sent to LLM (Groq/DeepSeek/Gemini)
        ↓
Answer returned with source citations
```

### Auth Flow
- **Register/Login** → issues `access_token` (15 min, httpOnly cookie) + `refresh_token` (7 days, httpOnly cookie, SHA-256 hashed in DB)
- **Every API request** → sends `access_token` cookie automatically
- **Token expired** → Axios interceptor auto-calls `POST /api/auth/refresh`, rotates both tokens, retries original request
- **Forgot password** → generates random 32-byte token, stores SHA-256 hash in DB (15 min expiry), sends reset link via Resend email
- **Reset password** → validates token hash, updates password, deletes all active sessions

---

## Deployment

| Layer | Platform | Notes |
|-------|----------|-------|
| Frontend | [Vercel](https://vercel.com) | Auto-deploys from `main` branch, SPA routing via `vercel.json` |
| Backend | [Render](https://render.com) | Free web service, Node.js, `render.yaml` included |
| Database | [Supabase](https://supabase.com) | PostgreSQL with `pgvector` extension, Transaction pooler for IPv4 compatibility |
| Email | [Resend](https://resend.com) | Password reset emails, 3,000 free emails/month |

---

## Environment Variables

### Server (`server/.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

# Server
PORT=5000
NODE_ENV=development

# LLM Providers (add at least ONE)
GROQ_API_KEY=your_groq_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
GEMINI_API_KEY=your_gemini_api_key

# Auth
JWT_SECRET=your_64_char_hex_secret
JWT_REFRESH_SECRET=your_different_64_char_hex_secret

# Email
RESEND_API_KEY=re_your_resend_key
FROM_EMAIL=onboarding@resend.dev

# CORS
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL with `pgvector` extension (or a Supabase project)

### Setup

```bash
# Clone
git clone https://github.com/your-username/personal-knowledge-search-engine.git
cd personal-knowledge-search-engine

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Database

Run the full schema against your PostgreSQL instance:

```bash
psql $DATABASE_URL -f server/src/config/schema.sql
```

Or use the included Docker Compose for a local Postgres + pgvector instance:

```bash
docker-compose up -d
```

### Run

```bash
# Terminal 1 — API server (port 5000)
cd server && npm run dev

# Terminal 2 — React client (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/           # AuthPage, ChatPage, ResetPasswordPage
│   │   ├── components/      # Sidebar, ChatWindow, MessageBubble, etc.
│   │   ├── contexts/        # AuthContext (user session state)
│   │   ├── services/        # api.js (Axios instance + interceptor)
│   │   └── styles/          # Tailwind + CSS design tokens
│   └── vercel.json
│
├── server/                  # Express API
│   ├── src/
│   │   ├── config/          # db.js, env.js, schema.sql
│   │   ├── controllers/     # auth, chat, upload, suggestion
│   │   ├── routes/          # auth, chat, upload, suggestion routes
│   │   ├── middlewares/     # auth.middleware.js, error.middleware.js
│   │   └── services/        # llm.service.js, email.service.js, embedding
│   └── render.yaml
│
└── docker-compose.yml       # Local Postgres + pgvector for dev
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in |
| POST | `/api/auth/logout` | — | Sign out |
| POST | `/api/auth/refresh` | — | Rotate token pair |
| GET | `/api/auth/me` | Required | Get current user |
| POST | `/api/auth/forgot-password` | — | Send reset email |
| POST | `/api/auth/reset-password` | — | Set new password |
| POST | `/api/upload` | Optional | Upload PDF/DOCX |
| POST | `/api/chat` | Required | RAG chat query |
| GET | `/api/chats` | Required | List chat history |
| GET | `/api/chats/search` | Required | Search chats |
| POST | `/api/chats` | Required | Create new chat |
| PATCH | `/api/chats/:id` | Required | Rename chat |
| GET | `/api/suggestions` | Optional | Get document Q&A suggestions |

---

## License

MIT

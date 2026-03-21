# Monorepo Architecture

## Repository Structure

```
Personal-Knowledge-Search-Engine/
├── client/                        # Frontend — React + Vite
├── server/                        # Backend — Node.js + Express
├── README.md
├── .gitignore
└── docs/                          # All architecture and spec docs
```

This is a **monorepo** — both frontend and backend live in one repository but operate as completely independent packages with their own `package.json`, dependencies, and `.env` files.

---

## Client (Frontend)

```
client/
├── src/
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── Chat.jsx
│   │   │   └── Chat.test.jsx
│   │   ├── Upload/
│   │   │   ├── Upload.jsx
│   │   │   └── Upload.test.jsx
│   │   ├── Suggestions/
│   │   │   ├── Suggestions.jsx
│   │   │   └── Suggestions.test.jsx
│   │   └── Sidebar/
│   │       ├── Sidebar.jsx
│   │       └── Sidebar.test.jsx
│   ├── pages/
│   │   ├── ChatPage.jsx
│   │   └── ChatPage.test.jsx
│   ├── services/
│   │   ├── api.js                 # Axios API calls
│   │   └── api.test.js
│   ├── hooks/
│   │   └── useChat.js
│   ├── utils/
│   │   └── helpers.js
│   ├── setupTests.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── tests/
│   └── e2e/                       # Playwright E2E tests
│       ├── upload.spec.js
│       ├── chat.spec.js
│       └── suggestions.spec.js
├── package.json
├── vite.config.js
└── .env                           # VITE_API_BASE_URL
```

### Client Tech Stack

| Tool                    | Purpose                            |
| ----------------------- | ---------------------------------- |
| React 18                | UI framework (functional + hooks)  |
| Vite                    | Dev server + build tool            |
| TypeScript              | Type safety                        |
| Tailwind CSS            | Utility-first styling              |
| Axios                   | HTTP client for API calls          |
| React Router v6         | Client-side routing                |
| Lucide React            | Icon library                       |
| Jest + React Testing Library | Component unit tests          |
| Playwright              | End-to-end browser tests           |

---

## Server (Backend)

```
server/
├── src/
│   ├── controllers/
│   │   ├── chat.controller.js
│   │   ├── upload.controller.js
│   │   └── suggestion.controller.js
│   ├── services/
│   │   ├── document.service.js    # text extraction + chunking
│   │   ├── embedding.service.js   # vector embedding generation
│   │   ├── search.service.js      # pgvector similarity search
│   │   └── suggestion.service.js  # generate + retrieve suggestions
│   ├── repositories/
│   │   └── document.repository.js # all DB queries
│   ├── routes/
│   │   ├── chat.routes.js
│   │   ├── upload.routes.js
│   │   └── suggestion.routes.js
│   ├── config/
│   │   ├── db.js                  # PostgreSQL connection pool
│   │   └── env.js                 # environment variable validation
│   ├── middlewares/
│   │   └── error.middleware.js    # global error handler
│   ├── utils/
│   │   ├── chunking.js            # text chunking logic
│   │   └── logger.js
│   ├── app.js                     # Express app setup
│   └── server.js                  # HTTP server entry point
├── tests/
│   ├── unit/
│   │   ├── services/              # unit tests for each service
│   │   └── utils/                 # unit tests for chunking, helpers
│   ├── integration/               # API endpoint integration tests
│   └── e2e/                       # optional Playwright API-level tests
├── package.json
└── .env                           # DATABASE_URL, GROQ_API_KEY, PORT
```

### Server Tech Stack

| Tool                 | Purpose                                     |
| -------------------- | ------------------------------------------- |
| Node.js              | JavaScript runtime                          |
| Express.js           | HTTP server and routing                     |
| pg (node-postgres)   | PostgreSQL client                           |
| pgvector             | Vector similarity queries                   |
| multer               | Multipart file upload handling              |
| pdf-parse            | Extract text from PDF files                 |
| mammoth              | Extract text from DOCX files                |
| sentence-transformers | Generate 768-dim embeddings                |
| Groq SDK             | LLM API calls (answer + suggestion gen)     |
| Jest                 | Unit and integration tests                  |
| dotenv               | Load environment variables                  |

---

## Naming Conventions

| Item          | Convention               | Example                       |
| ------------- | ------------------------ | ----------------------------- |
| Folders       | kebab-case               | `document-service/`           |
| JS/JSX files  | Feature-based naming     | `Chat.jsx`, `api.js`          |
| Controllers   | `*.controller.js`        | `chat.controller.js`          |
| Services      | `*.service.js`           | `document.service.js`         |
| Repositories  | `*.repository.js`        | `document.repository.js`      |
| Routes        | `*.routes.js`            | `chat.routes.js`              |
| Test files    | `*.test.jsx` / `*.test.js` | `Chat.test.jsx`             |
| E2E tests     | `*.spec.js`              | `upload.spec.js`              |

---

## Environment Files

### client/.env

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### server/.env

```
DATABASE_URL=postgresql://user:password@localhost:5432/knowbase
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

---

## Architecture Rules (Non-Negotiable)

- Controllers = HTTP validation + delegate only — no business logic
- Services = all business logic — no direct DB access
- Repositories = DB queries only — no logic
- No direct DB calls in controllers
- Frontend never accesses the database directly
- No mixing of frontend and backend code across `client/` and `server/`
- This folder structure is locked — do not change it

---

## Running Locally

```bash
# Terminal 1 — Database
docker run --name knowbase-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# Terminal 2 — Backend
cd server && npm install && npm run dev

# Terminal 3 — Frontend
cd client && npm install && npm run dev
```

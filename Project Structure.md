# Project Structure (STRICT)

## Root Structure

Personal-Knowledge-Search-Engine/
├── client/ # Frontend (React)
├── server/ # Backend (Node.js)
├── README.md

---

# 1️⃣ CLIENT (Frontend - React)

client/
├── src/
│ ├── components/
│ │ ├── Chat/
│ │ │ ├── Chat.jsx
│ │ │ └── Chat.test.jsx
│ │ │
│ │ ├── Upload/
│ │ │ ├── Upload.jsx
│ │ │ └── Upload.test.jsx
│ │ │
│ │ ├── Suggestions/
│ │ │ ├── Suggestions.jsx
│ │ │ └── Suggestions.test.jsx
│ │ │
│ │ └── Sidebar/
│ │ ├── Sidebar.jsx
│ │ └── Sidebar.test.jsx
│ │
│ ├── pages/
│ │ ├── ChatPage.jsx
│ │ └── ChatPage.test.jsx
│ │
│ ├── services/
│ │ ├── api.js
│ │ └── api.test.js
│ │
│ ├── hooks/
│ │ └── useChat.js
│ │
│ ├── utils/
│ │ └── helpers.js
│ │
│ ├── setupTests.js
│ ├── App.jsx
│ ├── main.jsx
│ └── index.css
│
├── public/
│
├── tests/
│ └── e2e/ # Playwright tests
│ ├── upload.spec.js
│ ├── chat.spec.js
│ └── suggestions.spec.js
│
├── package.json
└── vite.config.js

---

# 2️⃣ SERVER (Backend - Node.js)

server/
├── src/
│ ├── controllers/
│ │ ├── chat.controller.js
│ │ ├── upload.controller.js
│ │ └── suggestion.controller.js
│ │
│ ├── services/
│ │ ├── document.service.js
│ │ ├── embedding.service.js
│ │ ├── search.service.js
│ │ └── suggestion.service.js
│ │
│ ├── repositories/
│ │ └── document.repository.js
│ │
│ ├── routes/
│ │ ├── chat.routes.js
│ │ ├── upload.routes.js
│ │ └── suggestion.routes.js
│ │
│ ├── config/
│ │ ├── db.js
│ │ └── env.js
│ │
│ ├── middlewares/
│ │ └── error.middleware.js
│ │
│ ├── utils/
│ │ ├── chunking.js
│ │ └── logger.js
│ │
│ ├── app.js
│ └── server.js
│
├── tests/
│ ├── unit/
│ │ ├── services/
│ │ └── utils/
│ │
│ ├── integration/
│ │
│ └── e2e/ # Playwright (API-level if needed)
│
├── package.json
└── .env

---

# 3️⃣ TESTING STRUCTURE (FULL)

## Frontend

- Jest + React Testing Library
- Playwright (E2E)

Test Coverage:

- Component rendering
- User interactions
- API calls (mocked)
- Error states
- Loading states

---

## Backend

- Jest (unit + integration)
- Playwright (optional API E2E)

Test Coverage:

- Services logic
- DB queries
- API endpoints
- Edge cases

---

# 4️⃣ TESTING RULES (STRICT)

- Every component MUST have .test.jsx
- Every service MUST have unit tests
- Playwright must test:
  - upload flow
  - suggestion flow
  - chat flow

---

# 5️⃣ ENVIRONMENT FILES

client/.env
server/.env

Required variables:

- DATABASE_URL
- GROQ_API_KEY
- API_BASE_URL

---

# 6️⃣ NAMING CONVENTION

- folders → kebab-case
- files → feature-based naming
- controllers → \*.controller.js
- services → \*.service.js

---

# 7️⃣ ARCHITECTURE RULES (NON-NEGOTIABLE)

- Controllers = no business logic
- Services = all logic
- Repositories = DB access only
- No direct DB calls in controllers

---

# 8️⃣ TESTING BEST PRACTICES

- Use data-testid for UI elements
- Mock API calls in frontend tests
- Validate edge cases:
  - empty input
  - invalid file
  - no results

---

# FINAL RULE

This structure is LOCKED.

Claude must NOT:

- change folder structure
- mix frontend/backend logic
- skip test files

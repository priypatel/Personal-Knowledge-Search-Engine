# API Contracts

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP
**Date:** March 2026
**Base URL:** `http://localhost:3001/api` (development)

---

## 1. Conventions

- All requests and responses use `Content-Type: application/json` unless noted
- Authentication: `Authorization: Bearer <jwt_token>` header required on all protected routes
- Errors follow a standard format:
  ```json
  {
    "error": true,
    "message": "Human-readable error message",
    "code": "ERROR_CODE_CONSTANT"
  }
  ```
- Timestamps in ISO 8601 format: `"2026-03-21T08:30:18.000Z"`
- IDs are UUID v4 strings

---

## 2. Authentication Routes

### POST `/api/auth/register`
Create a new user account.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Priy Patel"
}
```

**Validation:**
- `email`: valid email format, required
- `password`: minimum 8 characters, required
- `name`: optional, max 100 chars

**Success Response — 201 Created:**
```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "name": "Priy Patel",
    "role": "user",
    "created_at": "2026-03-21T08:30:18.000Z"
  },
  "token": "eyJhbGci..."
}
```

**Error Responses:**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing fields or invalid format |
| 409 | `EMAIL_ALREADY_EXISTS` | Email is already registered |

---

### POST `/api/auth/login`
Authenticate with email and password.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response — 200 OK:**
```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "name": "Priy Patel",
    "role": "user"
  },
  "token": "eyJhbGci..."
}
```

**Error Responses:**
| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing fields |
| 401 | `INVALID_CREDENTIALS` | Email/password mismatch |

---

## 3. Upload Routes

### POST `/api/upload`
Upload a document for processing.

**Auth Required:** Yes

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | Yes | PDF, DOCX, or TXT. Max 10MB |
| `sessionId` | string | No | Attach to a chat session |

**Success Response — 202 Accepted:**
```json
{
  "document": {
    "id": "d1e2f3a4-...",
    "filename": "react-patterns.pdf",
    "status": "processing",
    "created_at": "2026-03-21T08:30:18.000Z"
  },
  "jobId": "bullmq-job-id-123"
}
```

**Error Responses:**
| Status | Code | Condition |
|---|---|---|
| 400 | `INVALID_FILE_TYPE` | File type not PDF/DOCX/TXT |
| 400 | `FILE_TOO_LARGE` | File exceeds 10MB |
| 400 | `NO_FILE_UPLOADED` | `file` field missing |
| 500 | `UPLOAD_FAILED` | Server-side processing error |

---

### GET `/api/documents`
Get all documents for the authenticated user.

**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | all | Filter by status: `processing`, `ready`, `error` |
| `limit` | integer | 20 | Max results |
| `offset` | integer | 0 | Pagination offset |

**Success Response — 200 OK:**
```json
{
  "documents": [
    {
      "id": "d1e2f3a4-...",
      "filename": "react-patterns.pdf",
      "file_type": "pdf",
      "file_size": 1024000,
      "status": "ready",
      "chunk_count": 47,
      "created_at": "2026-03-21T08:30:18.000Z"
    }
  ],
  "total": 1
}
```

---

### GET `/api/documents/:documentId/status`
Poll the processing status of an uploaded document.

**Auth Required:** Yes

**Success Response — 200 OK:**
```json
{
  "documentId": "d1e2f3a4-...",
  "status": "ready",
  "chunk_count": 47,
  "error_msg": null
}
```

**Error Responses:**
| Status | Code | Condition |
|---|---|---|
| 404 | `DOCUMENT_NOT_FOUND` | Document doesn't exist or not owned by user |

---

### DELETE `/api/documents/:documentId`
Delete a document and its associated data (pgvector embeddings + suggestions).

**Auth Required:** Yes

**Success Response — 200 OK:**
```json
{
  "message": "Document deleted successfully"
}
```

---

## 4. Chat Routes

### POST `/api/chat`
Send a query and receive an AI-generated answer grounded in documents.

**Auth Required:** Yes

**Request Body:**
```json
{
  "query": "What are the main design patterns in React?",
  "sessionId": "s1e2f3a4-...",
  "topK": 5
}
```

**Field Notes:**
- `query`: required, max 2000 characters
- `sessionId`: optional; if omitted, a new session is created
- `topK`: optional, default 5, max 10

**Success Response — 200 OK (streaming SSE):**
```
Content-Type: text/event-stream

data: {"type":"status","message":"Searching 3 documents..."}

data: {"type":"token","content":"React design patterns "}
data: {"type":"token","content":"include component "}
data: {"type":"token","content":"composition and..."}

data: {"type":"done","sessionId":"s1e2f3a4-...","messageId":"m1a2b3c4-..."}

data: {"type":"citations","citations":[
  {
    "id": 1,
    "document_id": "d1e2f3a4-...",
    "embedding_id": "e1f2a3b4-...",
    "filename": "react-patterns.pdf",
    "chunk_index": 12,
    "chunk_text": "Component composition is a pattern...",
    "page_ref": "p.12",
    "relevance_score": 0.94
  }
]}
```

**Non-streaming fallback (if SSE not supported) — 200 OK:**
```json
{
  "answer": "React design patterns include component composition and...",
  "sessionId": "s1e2f3a4-...",
  "messageId": "m1a2b3c4-...",
  "citations": [
    {
      "id": 1,
      "document_id": "d1e2f3a4-...",
      "embedding_id": "e1f2a3b4-...",
      "filename": "react-patterns.pdf",
      "chunk_index": 12,
      "page_ref": "p.12",
      "relevance_score": 0.94
    }
  ]
}
```

**Error Responses:**
| Status | Code | Condition |
|---|---|---|
| 400 | `QUERY_TOO_LONG` | Query exceeds 2000 chars |
| 400 | `NO_DOCUMENTS` | User has no ready documents |
| 503 | `SEARCH_UNAVAILABLE` | PostgreSQL/pgvector is unreachable |
| 503 | `LLM_UNAVAILABLE` | Groq API is unreachable |

---

### GET `/api/chat/sessions`
Get all chat sessions for the authenticated user (for sidebar history).

**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | 50 | Max sessions to return |
| `offset` | integer | 0 | Pagination offset |

**Success Response — 200 OK:**
```json
{
  "sessions": [
    {
      "id": "s1e2f3a4-...",
      "title": "What are React design patterns?",
      "message_count": 6,
      "updated_at": "2026-03-21T08:30:18.000Z"
    }
  ],
  "total": 1
}
```

---

### GET `/api/chat/sessions/:sessionId`
Get full message history for a chat session.

**Auth Required:** Yes

**Success Response — 200 OK:**
```json
{
  "session": {
    "id": "s1e2f3a4-...",
    "title": "What are React design patterns?",
    "created_at": "2026-03-21T08:00:00.000Z"
  },
  "messages": [
    {
      "id": "m1a2b3c4-...",
      "role": "user",
      "content": "What are the main design patterns in React?",
      "created_at": "2026-03-21T08:01:00.000Z"
    },
    {
      "id": "m2b3c4d5-...",
      "role": "assistant",
      "content": "React design patterns include...",
      "citations": [...],
      "created_at": "2026-03-21T08:01:03.000Z"
    }
  ]
}
```

---

### DELETE `/api/chat/sessions/:sessionId`
Delete a chat session and all its messages.

**Auth Required:** Yes

**Success Response — 200 OK:**
```json
{
  "message": "Chat session deleted successfully"
}
```

---

## 5. Suggestion Routes

### GET `/api/suggestions`
Get AI-generated suggested questions for the authenticated user.

**Auth Required:** Yes

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `documentId` | UUID | null | Filter suggestions by document |
| `limit` | integer | 3 | Max suggestions to return |

**Success Response — 200 OK:**
```json
{
  "suggestions": [
    {
      "id": "sg1a2b3c-...",
      "document_id": "d1e2f3a4-...",
      "filename": "react-patterns.pdf",
      "question": "What are the main advantages of using React hooks over class components?",
      "sort_order": 0
    },
    {
      "id": "sg2b3c4d-...",
      "document_id": "d1e2f3a4-...",
      "filename": "react-patterns.pdf",
      "question": "How does the Context API compare to Redux for state management?",
      "sort_order": 1
    }
  ]
}
```

---

## 6. Chunk / Citation Routes

### GET `/api/chunks/:embeddingId`
Retrieve the original text and metadata for a specific document chunk (used by citation panel).

**Auth Required:** Yes

**Success Response — 200 OK:**
```json
{
  "chunk": {
    "embedding_id": "uuid-...",
    "document_id": "d1e2f3a4-...",
    "filename": "react-patterns.pdf",
    "chunk_index": 12,
    "chunk_text": "Component composition is a pattern where smaller components are combined...",
    "page_ref": "p.12",
    "char_start": 1420,
    "char_end": 1950,
    "relevance_score": 0.94
  }
}
```

**Error Responses:**
| Status | Code | Condition |
|---|---|---|
| 404 | `CHUNK_NOT_FOUND` | Chunk not found or not owned by user |

---

## 7. Health Check

### GET `/api/health`
System health and readiness check.

**Auth Required:** No

**Success Response — 200 OK:**
```json
{
  "status": "ok",
  "services": {
    "postgres": "connected",
    "pgvector": "enabled",
    "redis": "connected"
  },
  "timestamp": "2026-03-21T08:30:18.000Z"
}
```

---

## 8. Error Code Reference

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed validation |
| `INVALID_FILE_TYPE` | 400 | File type not in allowlist |
| `FILE_TOO_LARGE` | 400 | File exceeds 10MB |
| `NO_FILE_UPLOADED` | 400 | `file` field missing from multipart form |
| `QUERY_TOO_LONG` | 400 | Query exceeds max length |
| `NO_DOCUMENTS` | 400 | User has no ready documents to search |
| `UNAUTHORIZED` | 401 | Missing/invalid JWT token |
| `INVALID_CREDENTIALS` | 401 | Email or password is wrong |
| `FORBIDDEN` | 403 | Authenticated but not authorized (e.g. wrong user's resource) |
| `DOCUMENT_NOT_FOUND` | 404 | Document doesn't exist or isn't owned by caller |
| `CHUNK_NOT_FOUND` | 404 | Embedding chunk not found in PostgreSQL |
| `EMAIL_ALREADY_EXISTS` | 409 | Registration email already in use |
| `UPLOAD_FAILED` | 500 | Server-side file processing error |
| `SEARCH_UNAVAILABLE` | 503 | PostgreSQL/pgvector unreachable |
| `LLM_UNAVAILABLE` | 503 | Groq API unreachable |

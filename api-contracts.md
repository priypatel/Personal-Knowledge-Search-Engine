# API Contracts

## Base URL

- Local: `http://localhost:5000/api`
- Production: `https://<render-service>.onrender.com/api`

All requests and responses use `Content-Type: application/json` unless otherwise noted.

---

## Endpoints

### POST /api/upload

Upload a document for processing.

**Request**

- Content-Type: `multipart/form-data`
- Body:

| Field | Type | Required | Description            |
| ----- | ---- | -------- | ---------------------- |
| file  | File | Yes      | PDF, DOCX, or TXT file |

**Constraints**
- Max file size: 10MB
- Accepted MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`

**Success Response — 200 OK**

```json
{
  "documentId": 1,
  "name": "my-notes.pdf",
  "status": "ready",
  "chunkCount": 12,
  "suggestions": [
    "What are the main topics covered?",
    "What is the key conclusion?",
    "What problems does this document solve?"
  ]
}
```

**Error Responses**

| Status | Condition                        | Body                                               |
| ------ | -------------------------------- | -------------------------------------------------- |
| 400    | No file attached                 | `{ "error": "No file provided" }`                  |
| 400    | Unsupported file type            | `{ "error": "Unsupported file type" }`             |
| 400    | File exceeds 10MB                | `{ "error": "File size exceeds 10MB limit" }`      |
| 400    | Empty document (no text)         | `{ "error": "Document is empty or unreadable" }`   |
| 500    | Embedding or processing failure  | `{ "error": "Processing failed. Please retry." }`  |

---

### POST /api/chat

Submit a query and receive a RAG-grounded answer.

**Request**

- Content-Type: `application/json`
- Body:

```json
{
  "query": "What are the key concepts discussed in my notes?"
}
```

| Field | Type   | Required | Description              |
| ----- | ------ | -------- | ------------------------ |
| query | string | Yes      | Natural language question |

**Success Response — 200 OK**

```json
{
  "answer": "Based on your documents, the key concepts include...",
  "sources": [
    {
      "documentId": 1,
      "documentName": "my-notes.pdf",
      "chunkId": 5,
      "content": "The key concept here is...",
      "similarity": 0.87
    },
    {
      "documentId": 1,
      "documentName": "my-notes.pdf",
      "chunkId": 8,
      "content": "Another relevant passage...",
      "similarity": 0.82
    }
  ]
}
```

| Field              | Type   | Description                                |
| ------------------ | ------ | ------------------------------------------ |
| answer             | string | LLM-generated answer grounded in documents |
| sources            | array  | Top-k retrieved chunks used in the answer  |
| sources[].documentId   | number | ID of the source document             |
| sources[].documentName | string | Filename of the source document        |
| sources[].chunkId      | number | ID of the matched chunk                |
| sources[].content      | string | Text content of the matched chunk      |
| sources[].similarity   | number | Cosine similarity score (0–1)          |

**No Match Response — 200 OK**

```json
{
  "answer": "No relevant data found in your documents.",
  "sources": []
}
```

**Error Responses**

| Status | Condition               | Body                                        |
| ------ | ----------------------- | ------------------------------------------- |
| 400    | Missing query field     | `{ "error": "Query is required" }`          |
| 400    | Empty query string      | `{ "error": "Query cannot be empty" }`      |
| 503    | LLM service unavailable | `{ "error": "AI service temporarily unavailable. Please retry." }` |
| 500    | Unexpected server error | `{ "error": "Internal server error" }`      |

---

### GET /api/suggestions

Retrieve AI-generated suggestions for a document.

**Request**

- Query parameters:

| Param      | Type   | Required | Description          |
| ---------- | ------ | -------- | -------------------- |
| documentId | number | Yes      | ID of the document   |

Example: `GET /api/suggestions?documentId=1`

**Success Response — 200 OK**

```json
{
  "documentId": 1,
  "suggestions": [
    {
      "id": 1,
      "question": "What are the main topics covered?"
    },
    {
      "id": 2,
      "question": "What is the key conclusion?"
    },
    {
      "id": 3,
      "question": "What problems does this document address?"
    }
  ]
}
```

**Error Responses**

| Status | Condition                        | Body                                         |
| ------ | -------------------------------- | -------------------------------------------- |
| 400    | Missing documentId param         | `{ "error": "documentId is required" }`      |
| 404    | Document not found               | `{ "error": "Document not found" }`          |
| 500    | Unexpected server error          | `{ "error": "Internal server error" }`       |

---

## Rules (Strict)

- All endpoints prefixed with `/api`
- Controllers must not contain business logic — delegate to services
- Every endpoint must validate required inputs and return appropriate 4xx on failure
- Never return raw database errors to the client
- `sources` must always be included in `/api/chat` response, even if empty
- Follow this contract strictly — no ad-hoc changes without updating this document

# MVC Technical Document

## Architecture Pattern

Model - View - Controller + Service Layer

---

## Model Layer (PostgreSQL + pgvector)

### Tables

#### documents

- id (PK)
- name
- created_at

#### document_chunks

- id (PK)
- document_id (FK)
- content (TEXT)
- embedding (VECTOR(768))

#### suggestions

- id
- document_id
- question

---

## View Layer (React)

### Components

- ChatPage
- UploadComponent
- SuggestionsList
- Sidebar (history)

---

## Controller Layer (Express)

### Routes

POST /upload
POST /chat
GET /suggestions

---

## Service Layer (IMPORTANT)

### 1. DocumentService

- extractText()
- chunkText()

### 2. EmbeddingService

- generateEmbedding(text)

### 3. SearchService

- similaritySearch(vector)

### 4. SuggestionService

- generateSuggestions(summary)

---

## Flow

Request → Controller → Service → DB → Response

---

## Constraints (STRICT)

- Controllers must NOT contain business logic
- All logic in services
- DB queries isolated in repository layer

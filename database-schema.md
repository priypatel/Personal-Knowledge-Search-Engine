# Database Schema

## Database

PostgreSQL with `pgvector` extension.

- Local: Docker (postgres:15 + pgvector)
- Production: Neon serverless PostgreSQL

---

## Setup

```sql
-- Enable pgvector extension (run once)
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Tables

### 1. `documents`

Stores metadata for each uploaded document.

```sql
CREATE TABLE documents (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  file_type   VARCHAR(10)  NOT NULL,        -- 'pdf' | 'docx' | 'txt'
  file_size   INTEGER,                       -- bytes
  status      VARCHAR(20)  NOT NULL DEFAULT 'processing',
              -- 'processing' | 'ready' | 'failed'
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

| Column     | Type         | Description                          |
| ---------- | ------------ | ------------------------------------ |
| id         | SERIAL PK    | Auto-incrementing document ID        |
| name       | VARCHAR(255) | Original filename                    |
| file_type  | VARCHAR(10)  | pdf / docx / txt                     |
| file_size  | INTEGER      | File size in bytes                   |
| status     | VARCHAR(20)  | processing / ready / failed          |
| created_at | TIMESTAMP    | Upload timestamp                     |

---

### 2. `document_chunks`

Stores text chunks and their vector embeddings.

```sql
CREATE TABLE document_chunks (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER      NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content     TEXT         NOT NULL,
  chunk_index INTEGER      NOT NULL,         -- position in document
  embedding   VECTOR(768)  NOT NULL
);
```

| Column      | Type        | Description                           |
| ----------- | ----------- | ------------------------------------- |
| id          | SERIAL PK   | Auto-incrementing chunk ID            |
| document_id | INTEGER FK  | References documents(id)              |
| content     | TEXT        | Raw text of the chunk (500–800 tokens)|
| chunk_index | INTEGER     | Chunk position within the document    |
| embedding   | VECTOR(768) | sentence-transformers 768-dim vector  |

---

### 3. `suggestions`

Stores AI-generated suggested questions per document.

```sql
CREATE TABLE suggestions (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER      NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  question    TEXT         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

| Column      | Type       | Description                        |
| ----------- | ---------- | ---------------------------------- |
| id          | SERIAL PK  | Auto-incrementing suggestion ID    |
| document_id | INTEGER FK | References documents(id)           |
| question    | TEXT       | LLM-generated suggested question  |
| created_at  | TIMESTAMP  | Generation timestamp               |

---

## Indexes

### Vector Similarity Index (CRITICAL)

```sql
-- ivfflat index for approximate nearest neighbor cosine search
CREATE INDEX ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

This index is required for performant vector similarity queries. Without it, every search performs a full table scan.

### Supporting Indexes

```sql
-- Speed up chunk lookups by document
CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);

-- Speed up suggestion lookups by document
CREATE INDEX idx_suggestions_document_id ON suggestions(document_id);
```

---

## Relationships

```
documents (1)
    │
    ├──< document_chunks (many)   [ON DELETE CASCADE]
    │
    └──< suggestions (many)       [ON DELETE CASCADE]
```

Deleting a document cascades to delete all its chunks and suggestions.

---

## Sample Queries

### Insert a document

```sql
INSERT INTO documents (name, file_type, file_size, status)
VALUES ('my-notes.pdf', 'pdf', 204800, 'processing')
RETURNING id;
```

### Insert a chunk with embedding

```sql
INSERT INTO document_chunks (document_id, content, chunk_index, embedding)
VALUES (1, 'This is chunk content...', 0, '[0.123, 0.456, ...]'::vector);
```

### Cosine similarity search (top-5)

```sql
SELECT
  dc.id,
  dc.content,
  dc.document_id,
  d.name AS document_name,
  1 - (dc.embedding <=> $1::vector) AS similarity
FROM document_chunks dc
JOIN documents d ON d.id = dc.document_id
ORDER BY dc.embedding <=> $1::vector
LIMIT 5;
```

### Get suggestions for a document

```sql
SELECT question FROM suggestions
WHERE document_id = $1
ORDER BY created_at ASC;
```

### Mark document as ready

```sql
UPDATE documents SET status = 'ready' WHERE id = $1;
```

---

## Constraints

- Do NOT use MongoDB — PostgreSQL only
- Do NOT use Qdrant or Pinecone — pgvector handles all vector storage
- Do NOT introduce additional databases
- Embedding dimension is fixed at 768 — must match sentence-transformers output
- ON DELETE CASCADE is required to keep DB clean when documents are removed

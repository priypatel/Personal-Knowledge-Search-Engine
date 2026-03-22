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
  embedding   VECTOR(384)  NOT NULL
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

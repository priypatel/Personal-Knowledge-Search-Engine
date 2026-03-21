# Scoring Engine Specification

## Purpose

The scoring engine determines which document chunks are most relevant to a user's query. It uses vector cosine similarity computed by PostgreSQL's pgvector extension.

---

## Embedding Model

| Property        | Value                                  |
| --------------- | -------------------------------------- |
| Model           | sentence-transformers (all-MiniLM-L6-v2 or equivalent) |
| Output dimension | 768                                   |
| Distance metric | Cosine similarity                      |
| Normalization   | L2-normalized vectors (unit length)    |

Both query embeddings and chunk embeddings must be generated with the same model to produce valid similarity scores.

---

## Scoring Formula

Cosine similarity between query vector **q** and chunk vector **c**:

```
similarity(q, c) = (q · c) / (|q| × |c|)
```

Range: 0 to 1 (for normalized vectors)
- 1.0 = identical semantic meaning
- 0.0 = completely unrelated

pgvector operator used:

```sql
-- Cosine distance (lower = more similar)
embedding <=> query_vector::vector

-- Converted to similarity score
1 - (embedding <=> query_vector::vector) AS similarity
```

---

## Retrieval Configuration

| Parameter         | Value | Rationale                                         |
| ----------------- | ----- | ------------------------------------------------- |
| Top-k             | 5     | Balances context richness with prompt size limits |
| Similarity cutoff | None (top-k only) | Return best 5 regardless of score  |
| Index type        | ivfflat | Approximate nearest neighbor — fast at scale   |
| ivfflat lists     | 100   | Default; tune upward as chunk count grows         |

---

## Database Index

```sql
CREATE INDEX ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Why ivfflat:**
- Significantly faster than exact scan for large datasets
- Acceptable recall (~95%) for this use case
- Supported natively by pgvector

**Note:** For fewer than ~1000 chunks, exact scan (no index) may be faster. The index becomes critical above ~10k chunks.

---

## Similarity Search Query

```sql
SELECT
  dc.id            AS chunk_id,
  dc.document_id,
  dc.content,
  dc.chunk_index,
  d.name           AS document_name,
  1 - (dc.embedding <=> $1::vector) AS similarity
FROM document_chunks dc
JOIN documents d ON d.id = dc.document_id
ORDER BY dc.embedding <=> $1::vector
LIMIT 5;
```

Parameters:
- `$1` — the 768-dim query embedding as a float array

---

## LLM Prompt Construction

After retrieving top-5 chunks, the prompt is assembled as:

```
System:
You are a precise assistant. Answer ONLY using the provided context.
If the context does not contain enough information, say "No relevant data found."
Do not use any external knowledge.

Context:
[1] (document_name, chunk_index)
<chunk_1_content>

[2] (document_name, chunk_index)
<chunk_2_content>

... (up to 5 chunks)

User:
<user_query>
```

---

## Response Format

The scoring engine's output passed to the API response:

```json
{
  "answer": "The answer derived from context...",
  "sources": [
    {
      "documentId": 1,
      "documentName": "notes.pdf",
      "chunkId": 12,
      "content": "Relevant chunk text...",
      "similarity": 0.89
    }
  ]
}
```

Sources are ordered by similarity score descending.

---

## Failure Conditions

| Condition                         | Behavior                                          |
| --------------------------------- | ------------------------------------------------- |
| No chunks in DB                   | Return `{ answer: "No relevant data found.", sources: [] }` |
| All similarity scores very low    | Still return top-5 (no hard cutoff in MVP)        |
| Embedding service fails           | Return 500 — do not proceed to DB query           |
| LLM service fails                 | Retry once — if still fails, return 503           |

---

## Chunking Parameters (Affects Scoring)

Chunk quality directly impacts retrieval quality.

| Parameter      | Value       | Notes                                        |
| -------------- | ----------- | -------------------------------------------- |
| Chunk size     | 500–800 tokens | Enough context, small enough to be specific |
| Overlap        | ~50–100 tokens | Prevents context loss at boundaries         |
| Splitting unit | Sentence/paragraph boundary preferred | Avoids mid-sentence cuts |

Implementation in: `server/src/utils/chunking.js`

---

## Constraints

- Embedding dimension is FIXED at 768 — do not change the model without migrating all embeddings
- Both document chunks and queries must use the identical embedding model
- The `ivfflat` index must be rebuilt if the embedding model is ever changed
- Do not bypass pgvector for a separate vector database (no Qdrant, no Pinecone)

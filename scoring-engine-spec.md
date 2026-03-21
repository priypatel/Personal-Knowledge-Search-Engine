# Scoring Engine Specification

**Project:** Knowbase — Personal Knowledge Search Engine
**Version:** 1.0 MVP  
**Date:** March 2026
**Component:** Relevance Scoring & Retrieval Engine

---

## 1. Overview

The scoring engine is the **relevance ranking system** within the RAG (Retrieval-Augmented Generation) pipeline. It determines which document chunks are returned for a given user query, and in what order. The quality of the final AI answer is entirely dependent on the scoring engine returning the right chunks.

Vector embeddings are stored in PostgreSQL using the **pgvector** extension, enabling similarity search within the same database as relational data.

---

## 2. Scoring Pipeline

```
User Query (natural language)
        ↓
[Step 1] Query Preprocessing
        ↓
[Step 2] Query Embedding Generation
        ↓
[Step 3] Vector Similarity Search (pgvector in PostgreSQL)
        ↓
[Step 4] Relevance Scoring & Ranking
        ↓
[Step 5] Top-K Chunk Selection
        ↓
[Step 6] Context Assembly for LLM
        ↓
LLM Answer Generation (Groq)
```

---

## 3. Step-by-Step Specification

### Step 1 — Query Preprocessing

Before embedding, the query is lightly normalized:

| Operation | Rule | Example |
|---|---|---|
| Trim whitespace | Remove leading/trailing spaces | `"  what is React? "` → `"what is React?"` |
| Length validation | Max 2000 characters; reject if exceeded | Return `QUERY_TOO_LONG` error |
| Empty check | Reject empty queries | Return `EMPTY_QUERY` error |
| No stemming | Do not stem or lowercase — embedding model handles semantics | Preserve original case |

### Step 2 — Query Embedding Generation

| Property | Value |
|---|---|
| Provider | Groq API (or compatible embedding endpoint) |
| Model | `text-embedding-ada-002` equivalent / Groq embedding model |
| Output | Float32 vector, 1536 dimensions |
| Normalization | L2-normalized before storage and search |
| Timeout | 5 seconds; retry once if timeout |

```ts
// Pseudocode
async function embedQuery(query: string): Promise<number[]> {
  const response = await groq.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });
  return response.data[0].embedding;
}
```

### Step 3 — Vector Similarity Search (pgvector)

Vector search is performed directly in PostgreSQL using the `<=>` cosine distance operator.

| Property | Value |
|---|---|
| Distance metric | Cosine distance (`<=>` operator; similarity = 1 - distance) |
| Scope | Filtered by `user_id` (user-scoped; no cross-user data) |
| Top-K | 5 (MVP default); configurable per request (max 10) |
| Score threshold | Minimum similarity score: **0.70** — chunks below this are discarded |
| Index type | HNSW (`vector_cosine_ops`) for fast approximate nearest neighbor search |
| Payload | Returns `chunk_text`, `filename`, `page_ref`, `chunk_index`, `document_id` |

```sql
-- pgvector similarity search query
SELECT
  id AS embedding_id,
  document_id,
  chunk_index,
  chunk_text,
  filename,
  page_ref,
  1 - (embedding <=> $1::vector) AS cosine_similarity
FROM document_embeddings
WHERE user_id = $2
  AND 1 - (embedding <=> $1::vector) >= 0.70
ORDER BY embedding <=> $1::vector ASC
LIMIT $3;  -- topK (default 5)
```

```ts
// Pseudocode (Knex raw query)
async function searchChunks(queryEmbedding: number[], userId: string, topK: number) {
  const vectorStr = `[${queryEmbedding.join(',')}]`;
  const results = await db.raw(`
    SELECT id, document_id, chunk_index, chunk_text, filename, page_ref,
           1 - (embedding <=> ?::vector) AS cosine_similarity
    FROM document_embeddings
    WHERE user_id = ?
      AND 1 - (embedding <=> ?::vector) >= 0.70
    ORDER BY embedding <=> ?::vector ASC
    LIMIT ?
  `, [vectorStr, userId, vectorStr, vectorStr, topK]);
  return results.rows;
}
```

### Step 4 — Relevance Scoring & Ranking

After retrieval, chunks are **re-ranked** by a composite relevance score:

```
final_score = (0.8 × cosine_similarity) + (0.2 × recency_boost)
```

| Factor | Weight | Rationale |
|---|---|---|
| Cosine similarity | 0.8 | Primary semantic relevance signal |
| Recency boost | 0.2 | Slightly prefer recently uploaded documents |

**Recency boost formula:**
```
days_since_upload = (now - document.created_at) / 86400000
recency_score = max(0, 1 - (days_since_upload / 30))
```
Documents uploaded within the last 30 days get a boost that decays linearly to 0 at 30+ days.

**Post-scoring de-duplication:** If two chunks from the same document within 2 chunk indices of each other both score above threshold, keep only the higher-scoring one. This prevents near-duplicate context fragments.

### Step 5 — Top-K Chunk Selection

After scoring and de-duplication:
- Sort by `final_score` descending
- Take top `K` chunks (default K=5)
- If fewer than K chunks pass threshold → use all passing chunks (may be 0)
- If 0 chunks pass → return `NO_RESULTS` condition (do not call LLM)

### Step 6 — Context Assembly

Chunks are formatted into a context block for the LLM prompt:

```
[Source 1: react-patterns.pdf, p.12]
Component composition is a pattern where smaller components are combined into larger
ones using the children prop or render props pattern...

[Source 2: system-design-notes.docx, p.3]
When designing large React applications, separating concerns into custom hooks...

[Source 3: react-patterns.pdf, p.24]
The Context API allows you to share state across the component tree without...
```

**Rules:**
- Each chunk labeled with `[Source N: filename, page_ref]`
- Chunks in descending order of relevance score
- Maximum total context length: **6,000 tokens** (to fit within Groq model context window with room for prompt + response)
- If assembled context exceeds 6,000 tokens: truncate the lowest-scoring chunk(s) until within limit

---

## 4. LLM Prompt Template

```
You are a document assistant. Answer questions ONLY from the provided context.
If the answer is not found in the context, respond exactly:
"I don't have information on that in your uploaded documents."
Never answer from general knowledge.

Context:
{context_block}

Question: {query}

Answer:
```

**Prompt design rules:**
- Strict RAG mode — model is instructed not to use world knowledge
- Fallback response is hardcoded in the prompt to prevent hallucination
- No multi-turn context injection in MVP (each query is standalone)

---

## 5. Chunking Strategy

The quality of retrieval depends heavily on how documents are chunked at index time.

| Property | Value |
|---|---|
| Chunk size | ~500 tokens (~2,000 characters) |
| Overlap | 50 tokens (~200 characters) between consecutive chunks |
| Method | Sentence-aware split: prefer splitting at sentence boundaries |
| Min chunk size | 100 tokens — discard below this |
| File-level metadata | Each chunk tagged with `document_id`, `chunk_index`, `page_ref` |

**Chunking algorithm (pseudocode):**
```ts
function chunkText(text: string): string[] {
  const sentences = splitIntoSentences(text);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (tokenCount(current + sentence) > CHUNK_SIZE) {
      if (current.length > MIN_CHUNK_SIZE) {
        chunks.push(current.trim());
      }
      // Start new chunk with overlap from previous
      const overlapText = lastNTokens(current, OVERLAP_SIZE);
      current = overlapText + ' ' + sentence;
    } else {
      current += ' ' + sentence;
    }
  }

  if (tokenCount(current) >= MIN_CHUNK_SIZE) {
    chunks.push(current.trim());
  }

  return chunks;
}
```

---

## 6. Suggestion Generation Engine

The suggestion engine is separate from the query scoring engine but lives in the same worker pipeline.

### 6.1 Trigger
- Fires once per document, immediately after chunking and embedding

### 6.2 Process
```
1. Generate document summary:
   Prompt: "Summarize this document in 3–5 sentences: {first_3_chunks}"

2. Generate 3 suggested questions:
   Prompt: "Based on this document summary, generate exactly 3 useful, specific
   questions a reader might ask. Return as a JSON array of strings.
   Summary: {summary}"

3. Parse JSON response
4. Store 3 questions in PostgreSQL.suggestions table
5. Cache in Redis: key = suggestions:{userId}, TTL = 24h
```

### 6.3 Fallback
- If LLM call fails: log error, mark `suggestion_status = 'failed'` on document, use static fallback suggestions for UI
- Static fallbacks: `["What are the main topics in this document?", "Summarize the key points", "What questions does this document answer?"]`

---

## 7. Scoring Engine Configuration

| Parameter | Default | Notes |
|---|---|---|
| `TOP_K` | 5 | Max chunks retrieved per query |
| `SCORE_THRESHOLD` | 0.70 | Minimum cosine similarity |
| `CHUNK_SIZE` | 500 tokens | Target chunk size |
| `CHUNK_OVERLAP` | 50 tokens | Overlap between consecutive chunks |
| `MAX_CONTEXT_TOKENS` | 6000 | Max tokens sent to LLM |
| `COSINE_WEIGHT` | 0.8 | Weight in composite scoring |
| `RECENCY_WEIGHT` | 0.2 | Weight in composite scoring |
| `RECENCY_DECAY_DAYS` | 30 | Days until recency boost = 0 |
| `EMBEDDING_DIMENSIONS` | 1536 | Must match embedding model output |
| `SUGGESTION_COUNT` | 3 | Suggestions per document |
| `HNSW_M` | 16 | HNSW index max connections per node |
| `HNSW_EF_CONSTRUCTION` | 64 | HNSW index build-time search depth |

---

## 8. Failure Modes & Mitigation

| Failure | Detection | Mitigation |
|---|---|---|
| No chunks pass threshold | `results.length === 0` after filtering | Return `"No relevant results in your documents"` — do not call LLM |
| Embedding API timeout | 5s timeout | Retry once; return 503 after second failure |
| PostgreSQL unreachable | Connection error on SQL query | Return 503 `SEARCH_UNAVAILABLE` |
| Context exceeds token limit | Token count check pre-LLM | Truncate lowest-scoring chunks |
| Suggestion JSON parse fails | JSON.parse error | Use fallback static suggestions |
| Chunk below minimum size | Token count < 100 | Discard; merge with adjacent chunk if possible |

---

## 9. pgvector Performance Tuning

| Setting | Recommendation |
|---|---|
| Index type | HNSW (preferred) — better recall than IVFFlat; slightly slower builds |
| `m` parameter | 16 (default); increase to 32 for higher recall if needed |
| `ef_construction` | 64 (default); increase to 128 for higher recall at build time |
| Query `ef_search` | Set via `SET hnsw.ef_search = 40;` (default); increase for higher recall at query time |
| Maintenance | HNSW index auto-maintained on INSERT; no manual REINDEX needed |
| Scaling limit | Comfortable up to ~500K vectors in a single PostgreSQL instance |
| Connection pooling | Use pgBouncer in production to manage connection overhead |

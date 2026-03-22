import { query } from '../config/db.js';

/**
 * Find the top-5 most similar document chunks to a query vector.
 * @param {number[]} queryVector - 384-dim embedding
 * @param {number|null} documentId - restrict search to this document when provided
 * @returns {Promise<Array<{chunkId, documentId, documentName, content, chunkIndex, similarity}>>}
 */
export async function similaritySearch(queryVector, documentId = null) {
  const vectorParam = '[' + queryVector.join(',') + ']';

  const params = [vectorParam];
  const whereClause = documentId ? `WHERE dc.document_id = $2` : '';
  if (documentId) params.push(documentId);

  const sql = `
    SELECT
      dc.id          AS chunk_id,
      dc.document_id,
      dc.content,
      dc.chunk_index,
      d.name         AS document_name,
      1 - (dc.embedding <=> $1::vector) AS similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    ${whereClause}
    ORDER BY dc.embedding <=> $1::vector
    LIMIT 5
  `;

  const result = await query(sql, params);

  return result.rows.map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    documentName: row.document_name,
    content: row.content,
    chunkIndex: row.chunk_index,
    similarity: parseFloat(row.similarity),
  }));
}

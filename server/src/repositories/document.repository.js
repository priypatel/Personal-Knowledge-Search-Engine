import { query } from '../config/db.js';

/**
 * Insert a new document record (status defaults to 'processing').
 * @returns {Promise<{id: number}>}
 */
export async function insertDocument(name, fileType, fileSize, userId = null) {
  const result = await query(
    `INSERT INTO documents (user_id, name, file_type, file_size, status)
     VALUES ($1, $2, $3, $4, 'processing')
     RETURNING id`,
    [userId, name, fileType, fileSize]
  );
  return { id: result.rows[0].id };
}

/**
 * Update the status field of a document.
 * @param {number} id
 * @param {'processing'|'ready'|'failed'} status
 */
export async function updateDocumentStatus(id, status) {
  await query('UPDATE documents SET status = $1 WHERE id = $2', [status, id]);
}

/**
 * Insert a document chunk with its embedding vector.
 * @param {number} documentId
 * @param {string} content
 * @param {number} chunkIndex
 * @param {number[]} embedding - 384-dim float array
 */
export async function insertChunk(documentId, content, chunkIndex, embedding) {
  const vectorLiteral = `[${embedding.join(',')}]`;
  await query(
    `INSERT INTO document_chunks (document_id, content, chunk_index, embedding)
     VALUES ($1, $2, $3, $4::vector)`,
    [documentId, content, chunkIndex, vectorLiteral]
  );
}

/**
 * Insert a suggestion question for a document.
 */
export async function insertSuggestion(documentId, question) {
  await query(
    'INSERT INTO suggestions (document_id, question) VALUES ($1, $2)',
    [documentId, question]
  );
}

/**
 * Get a single document by id.
 * @returns {Promise<object|null>}
 */
export async function getDocumentById(id) {
  const result = await query('SELECT * FROM documents WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Get all documents ordered by creation date descending.
 * @returns {Promise<object[]>}
 */
export async function getAllDocuments() {
  const result = await query(
    'SELECT * FROM documents ORDER BY created_at DESC'
  );
  return result.rows;
}

/**
 * Get all suggestions for a document.
 * @returns {Promise<object[]>}
 */
export async function getSuggestionsByDocumentId(documentId) {
  const result = await query(
    'SELECT * FROM suggestions WHERE document_id = $1 ORDER BY id',
    [documentId]
  );
  return result.rows;
}

/**
 * Get all chunks for a document.
 * @returns {Promise<object[]>}
 */
export async function getChunksByDocumentId(documentId) {
  const result = await query(
    'SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index',
    [documentId]
  );
  return result.rows;
}

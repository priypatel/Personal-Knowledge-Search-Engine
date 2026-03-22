import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Upload a document file to the server.
 * @param {File} file
 * @returns {Promise<{documentId, name, status, chunkCount, suggestions}>}
 */
export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
};

/**
 * Send a chat query to the RAG pipeline.
 * @param {string} query
 * @param {number|null} documentId - restrict search to this document when provided
 * @returns {Promise<{answer, sources}>}
 */
export const sendChat = (query, documentId = null) =>
  api.post('/chat', { query, documentId }).then((res) => res.data);

/**
 * Get AI-generated suggestions for a document.
 * @param {number} documentId
 * @returns {Promise<{documentId, suggestions}>}
 */
export const getSuggestions = (documentId) =>
  api.get('/suggestions', { params: { documentId } }).then((res) => res.data);

export default api;

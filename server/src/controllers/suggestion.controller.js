import {
  getDocumentById,
  getSuggestionsByDocumentId,
} from '../repositories/document.repository.js';

/**
 * GET /api/suggestions?documentId=<id>
 * Response: { documentId: number, suggestions: [{id, question}] }
 */
export async function getSuggestions(req, res, next) {
  const { documentId: documentIdRaw } = req.query;

  if (!documentIdRaw) {
    return res.status(400).json({ error: 'documentId is required' });
  }

  const documentId = parseInt(documentIdRaw, 10);
  if (isNaN(documentId)) {
    return res.status(400).json({ error: 'documentId must be a valid integer' });
  }

  const document = await getDocumentById(documentId);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const rows = await getSuggestionsByDocumentId(documentId);

  return res.status(200).json({
    documentId,
    suggestions: rows.map((s) => ({ id: s.id, question: s.question })),
  });
}

import * as documentService from '../services/document.service.js';
import * as embeddingService from '../services/embedding.service.js';
import * as suggestionService from '../services/suggestion.service.js';
import * as documentRepository from '../repositories/document.repository.js';
import logger from '../utils/logger.js';

const ACCEPTED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadDocument(req, res, next) {
  // Validate file presence
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Validate file type
  if (!ACCEPTED_MIMES.has(req.file.mimetype)) {
    return res.status(400).json({
      error: 'File type not supported. Upload a PDF, DOCX, or TXT file.',
    });
  }

  // Validate file size
  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(400).json({ error: 'File size exceeds 10MB limit.' });
  }

  let documentId = null;

  try {
    // Extract text
    const text = await documentService.extractText(
      req.file.buffer,
      req.file.mimetype
    );

    // Chunk the text
    const chunks = documentService.chunkText(text);

    // Insert document record
    const { id } = await documentRepository.insertDocument(
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );
    documentId = id;
    logger.info(`Document ${id} created, processing ${chunks.length} chunks`);

    // Generate and store embeddings
    for (const chunk of chunks) {
      const embedding = await embeddingService.generateEmbedding(chunk.content);
      await documentRepository.insertChunk(
        documentId,
        chunk.content,
        chunk.chunkIndex,
        embedding
      );
    }

    // Generate suggestions from document summary
    const summary = text.slice(0, 1000);
    const suggestions = await suggestionService.generateSuggestions(
      req.file.originalname,
      summary
    );

    for (const question of suggestions) {
      await documentRepository.insertSuggestion(documentId, question);
    }

    // Mark ready
    await documentRepository.updateDocumentStatus(documentId, 'ready');
    logger.info(`Document ${documentId} ready`);

    return res.status(200).json({
      documentId,
      name: req.file.originalname,
      status: 'ready',
      chunkCount: chunks.length,
      suggestions,
    });
  } catch (err) {
    // Mark as failed if we already created the document record
    if (documentId) {
      await documentRepository.updateDocumentStatus(documentId, 'failed').catch(() => {});
    }

    // Return 400 for user-facing errors (empty doc, bad type detected late)
    if (err.message === 'Empty document') {
      return res.status(400).json({ error: 'The uploaded document is empty.' });
    }

    return next(err);
  }
}

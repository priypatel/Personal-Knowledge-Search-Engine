import * as embeddingService from '../services/embedding.service.js';
import * as searchService from '../services/search.service.js';
import { llmChat } from '../services/llm.service.js';

/**
 * POST /api/chat
 * Body: { query: string }
 * Response: { answer: string, sources: chunk[] }
 */
export async function sendMessage(req, res, next) {
  const { query, documentId } = req.body;

  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'query is required and must be a non-empty string' });
  }

  const trimmedQuery = query.trim();
  const scopedDocumentId = documentId ? Number(documentId) : null;

  const queryVector = await embeddingService.generateEmbedding(trimmedQuery);
  const chunks = await searchService.similaritySearch(queryVector, scopedDocumentId);

  if (chunks.length === 0) {
    return res.status(200).json({
      answer: 'No relevant data found in your documents.',
      sources: [],
    });
  }

  const contextLines = chunks
    .map((c, i) => `[${i + 1}] (${c.documentName})\n${c.content}`)
    .join('\n\n');

  const systemPrompt =
    `You are a precise assistant. Answer ONLY using the provided context below.\n` +
    `If the context does not contain enough information to answer, say exactly:\n` +
    `'No relevant data found in your documents.'\n` +
    `Do not use any knowledge outside the provided context.\n\n` +
    `Context:\n${contextLines}`;

  try {
    const { content } = await llmChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: trimmedQuery },
    ]);

    return res.status(200).json({
      answer: content,
      sources: chunks,
    });
  } catch (err) {
    err.status = 503;
    return next(err);
  }
}

import * as embeddingService from '../services/embedding.service.js';
import * as searchService from '../services/search.service.js';
import { llmChat } from '../services/llm.service.js';
import * as chatRepo from '../repositories/chat.repository.js';

/**
 * GET /api/chats
 * Returns all chats (with messages) for the authenticated user.
 */
export async function getChats(req, res) {
  const chats = await chatRepo.getChatsByUserId(req.user.id);
  return res.status(200).json(chats);
}

/**
 * POST /api/chats
 * Body: { title?, documentId?, documentName? }
 */
export async function createChat(req, res) {
  const { title, documentId, documentName } = req.body;
  const chat = await chatRepo.createChat(req.user.id, { title, documentId, documentName });
  return res.status(201).json(chat);
}

/**
 * PATCH /api/chats/:id
 * Body: { title }
 */
export async function patchChat(req, res) {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  await chatRepo.updateChatTitle(Number(req.params.id), req.user.id, title);
  return res.status(200).json({ ok: true });
}

/**
 * POST /api/chat
 * Body: { query, documentId?, chatId? }
 */
export async function sendMessage(req, res, next) {
  const { query, documentId, chatId } = req.body;

  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'query is required and must be a non-empty string' });
  }

  const trimmedQuery = query.trim();
  const scopedDocumentId = documentId ? Number(documentId) : null;
  const numericChatId = chatId ? Number(chatId) : null;

  const queryVector = await embeddingService.generateEmbedding(trimmedQuery);
  const chunks = await searchService.similaritySearch(queryVector, scopedDocumentId);

  if (chunks.length === 0) {
    if (numericChatId) {
      const msgCount = await chatRepo.countMessages(numericChatId);
      await chatRepo.saveMessage(numericChatId, 'user', trimmedQuery, null);
      await chatRepo.saveMessage(numericChatId, 'assistant', 'No relevant data found in your documents.', null);
      if (msgCount === 0) {
        await chatRepo.updateChatTitle(numericChatId, req.user.id, trimmedQuery.slice(0, 50));
      }
    }
    return res.status(200).json({ answer: 'No relevant data found in your documents.', sources: [] });
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

    if (numericChatId) {
      const msgCount = await chatRepo.countMessages(numericChatId);
      await chatRepo.saveMessage(numericChatId, 'user', trimmedQuery, null);
      await chatRepo.saveMessage(numericChatId, 'assistant', content, chunks);
      if (msgCount === 0) {
        await chatRepo.updateChatTitle(numericChatId, req.user.id, trimmedQuery.slice(0, 50));
      }
    }

    return res.status(200).json({ answer: content, sources: chunks });
  } catch (err) {
    err.status = 503;
    return next(err);
  }
}

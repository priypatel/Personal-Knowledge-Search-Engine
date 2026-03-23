import { query } from '../config/db.js';

/**
 * Create a new chat for a user.
 * @returns {Promise<object>} — { id, title, documentId, documentName, createdAt, messages: [] }
 */
export async function createChat(userId, { title = 'New Chat', documentId = null, documentName = null } = {}) {
  const result = await query(
    `INSERT INTO chats (user_id, title, document_id, document_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, document_id, document_name, created_at`,
    [userId, title, documentId, documentName]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    documentId: row.document_id,
    documentName: row.document_name,
    createdAt: row.created_at,
    messages: [],
  };
}

/**
 * Get all chats for a user, ordered newest first, with their messages.
 * @returns {Promise<object[]>}
 */
export async function getChatsByUserId(userId) {
  const result = await query(
    `SELECT
       c.id,
       c.title,
       c.document_id,
       c.document_name,
       c.created_at,
       COALESCE(
         json_agg(
           json_build_object(
             'id',        m.id,
             'role',      m.role,
             'content',   m.content,
             'sources',   m.sources,
             'createdAt', m.created_at
           ) ORDER BY m.created_at
         ) FILTER (WHERE m.id IS NOT NULL),
         '[]'
       ) AS messages
     FROM chats c
     LEFT JOIN chat_messages m ON m.chat_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    documentId: row.document_id,
    documentName: row.document_name,
    createdAt: row.created_at,
    messages: row.messages,
  }));
}

/**
 * Search chats by title for a user (case-insensitive).
 */
export async function searchChatsByUserId(userId, q) {
  const result = await query(
    `SELECT id, title, document_id, document_name, created_at
     FROM chats
     WHERE user_id = $1 AND title ILIKE $2
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId, `%${q}%`]
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    documentId: row.document_id,
    documentName: row.document_name,
    createdAt: row.created_at,
    messages: [],
  }));
}

/**
 * Update a chat's title.
 */
export async function updateChatTitle(chatId, userId, title) {
  await query(
    'UPDATE chats SET title = $1 WHERE id = $2 AND user_id = $3',
    [title, chatId, userId]
  );
}

/**
 * Save a message to a chat.
 * @returns {Promise<object>} the saved message row
 */
export async function saveMessage(chatId, role, content, sources = null) {
  const result = await query(
    `INSERT INTO chat_messages (chat_id, role, content, sources)
     VALUES ($1, $2, $3, $4)
     RETURNING id, role, content, sources, created_at`,
    [chatId, role, content, sources ? JSON.stringify(sources) : null]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    sources: row.sources,
    createdAt: row.created_at,
  };
}

/**
 * Count messages in a chat (used to decide if title should auto-update).
 */
export async function countMessages(chatId) {
  const result = await query(
    'SELECT COUNT(*) AS count FROM chat_messages WHERE chat_id = $1',
    [chatId]
  );
  return parseInt(result.rows[0].count, 10);
}

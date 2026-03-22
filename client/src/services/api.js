import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // send httpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = (email, displayName, password) =>
  api.post('/auth/register', { email, displayName, password }).then((r) => r.data);

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const logout = () =>
  api.post('/auth/logout').then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

// ── Chats ─────────────────────────────────────────────────────────────────────

export const getChats = () =>
  api.get('/chats').then((r) => r.data);

export const createChat = ({ title, documentId, documentName } = {}) =>
  api.post('/chats', { title, documentId, documentName }).then((r) => r.data);

export const updateChatTitle = (chatId, title) =>
  api.patch(`/chats/${chatId}`, { title }).then((r) => r.data);

// ── Documents ─────────────────────────────────────────────────────────────────

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

// ── Chat / RAG ────────────────────────────────────────────────────────────────

export const sendChat = (query, documentId = null, chatId = null) =>
  api.post('/chat', { query, documentId, chatId }).then((r) => r.data);

export const getSuggestions = (documentId) =>
  api.get('/suggestions', { params: { documentId } }).then((r) => r.data);

export default api;

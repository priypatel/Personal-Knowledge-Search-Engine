import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // send httpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

// ── Axios interceptor: auto-refresh on 401 ────────────────────────────────────
let isRefreshing = false;
let refreshQueue = []; // callbacks waiting for the new token

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only attempt refresh for 401s that haven't been retried yet,
    // and never retry the refresh call itself.
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true;

      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => api(original)).catch((e) => Promise.reject(e));
      }

      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        refreshQueue.forEach(({ resolve }) => resolve());
        refreshQueue = [];
        return api(original);
      } catch (refreshErr) {
        refreshQueue.forEach(({ reject }) => reject(refreshErr));
        refreshQueue = [];
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = (email, displayName, password) =>
  api.post('/auth/register', { email, displayName, password }).then((r) => r.data);

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const logout = () =>
  api.post('/auth/logout').then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (token, password) =>
  api.post('/auth/reset-password', { token, password }).then((r) => r.data);

// ── Chats ─────────────────────────────────────────────────────────────────────

export const getChats = () =>
  api.get('/chats').then((r) => r.data);

export const searchChats = (q) =>
  api.get('/chats/search', { params: { q } }).then((r) => r.data);

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

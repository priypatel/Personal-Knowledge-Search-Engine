import { useState, useEffect, useCallback, useMemo } from 'react';
import Chat from '../components/Chat/Chat.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import Toast from '../components/shared/Toast.jsx';
import { getChats, createChat as apiCreateChat, updateChatTitle } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState(null);
  const [chatsLoading, setChatsLoading] = useState(true);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const effectiveDocumentId = uploadedDocumentId ?? activeChat?.documentId ?? null;

  // Derive documents list from chats — persists across logout/login since it
  // comes from the server-loaded chats, not transient upload state.
  const documents = useMemo(() => {
    const seen = new Set();
    const docs = [];
    for (const chat of chats) {
      if (chat.documentId && !seen.has(chat.documentId)) {
        seen.add(chat.documentId);
        const ext = (chat.documentName || '').split('.').pop().toLowerCase();
        docs.push({ id: chat.documentId, name: chat.documentName, fileType: ext });
      }
    }
    return docs;
  }, [chats]);

  // Load chats from server on mount
  useEffect(() => {
    getChats()
      .then(setChats)
      .catch(() => setToast({ message: 'Failed to load chat history.', type: 'error' }))
      .finally(() => setChatsLoading(false));
  }, []);

  const handleNewChat = useCallback(async () => {
    try {
      const chat = await apiCreateChat({ title: 'New Chat' });
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.id);
      setUploadedDocumentId(null);
    } catch {
      setToast({ message: 'Could not create chat. Please try again.', type: 'error' });
    }
  }, []);

  function handleChatSelect(chat) {
    setActiveChatId(chat.id);
    setUploadedDocumentId(null);
  }

  async function handleUploadSuccess(res) {
    const name = res?.name || `Document ${res?.documentId}`;

    setUploadedDocumentId(res.documentId);

    // Create chat session on server — the documents sidebar is derived from
    // chats automatically via the useMemo above, so no separate documents state needed.
    try {
      const chat = await apiCreateChat({
        title: name,
        documentId: res.documentId,
        documentName: name,
      });
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.id);
    } catch {
      setToast({ message: 'Could not create chat session. Please try again.', type: 'error' });
    }
  }

  function handleUploadError(message) {
    setToast({ message: message || 'Upload failed. Please try again.', type: 'error' });
  }

  function handleMessageSent(messages) {
    if (!activeChatId) return;
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) : 'New Chat';
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, title, messages } : c))
    );
    updateChatTitle(activeChatId, title).catch(() => {});
  }

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'TEXTAREA' && tag !== 'INPUT') {
        e.preventDefault();
        document.querySelector('[data-testid="message-input"]')?.focus();
      }
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleNewChat();
      }
      if (e.key === 'Escape') {
        document.activeElement?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat]);

  return (
    <div
      data-testid="chat-page"
      className="flex h-screen bg-surface font-sans overflow-hidden"
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        documents={documents}
        user={user}
        onLogout={logout}
        loading={chatsLoading}
      />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Chat
          key={activeChatId ?? 'default'}
          documentId={effectiveDocumentId}
          chatId={activeChatId}
          initialMessages={activeChat?.messages ?? []}
          onMessageSent={handleMessageSent}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          documentName={activeChat?.documentName ?? null}
        />
      </main>
    </div>
  );
}

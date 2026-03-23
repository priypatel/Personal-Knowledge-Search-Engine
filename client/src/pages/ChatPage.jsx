import { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu } from 'lucide-react';
import Chat from '../components/Chat/Chat.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import Toast from '../components/shared/Toast.jsx';
import { getChats, createChat as apiCreateChat, updateChatTitle } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  // chatKey controls Chat remounting. Separate from activeChatId so that
  // lazily assigning a real chatId (on first message) does NOT remount Chat.
  const [chatKey, setChatKey] = useState('default');
  const [toast, setToast] = useState(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState(null);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const effectiveDocumentId = uploadedDocumentId ?? activeChat?.documentId ?? null;

  // Derive documents list from chats
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

  const handleNewChat = useCallback(() => {
    // Already in new-chat mode — do nothing (prevents duplicate blank entries)
    if (activeChatId === null && chatKey === 'default') return;
    setActiveChatId(null);
    setUploadedDocumentId(null);
    setChatKey('default');
    setMobileMenuOpen(false);
  }, [activeChatId, chatKey]);

  // Called by Chat when it lazily creates a chat on the first message.
  // Does NOT change chatKey — Chat must NOT remount so the user sees the response.
  function handleChatCreated(chat) {
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    // chatKey stays the same — Chat keeps running, user sees the AI response
  }

  function handleChatSelect(chat) {
    setActiveChatId(chat.id);
    setUploadedDocumentId(null);
    setChatKey(`chat-${chat.id}`); // remount Chat with the selected chat's messages
    setMobileMenuOpen(false);
  }

  async function handleUploadSuccess(res) {
    const name = res?.name || `Document ${res?.documentId}`;
    setUploadedDocumentId(res.documentId);
    setMobileMenuOpen(false);
    try {
      const chat = await apiCreateChat({
        title: name,
        documentId: res.documentId,
        documentName: name,
      });
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.id);
      setChatKey(`chat-${chat.id}`);
    } catch {
      setToast({ message: 'Could not create chat session. Please try again.', type: 'error' });
    }
  }

  function handleUploadError(message) {
    setToast({ message: message || 'Upload failed. Please try again.', type: 'error' });
  }

  function handleRenameChat(chatId, title) {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title } : c)));
  }

  // Chat passes the resolved chatId (may differ from activeChatId during lazy creation)
  function handleMessageSent(messages, resolvedChatId) {
    const id = resolvedChatId ?? activeChatId;
    if (!id) return;
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) : 'New Chat';
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, messages } : c))
    );
    updateChatTitle(id, title).catch(() => {});
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
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.querySelector('[data-testid="chat-search-input"]')?.focus();
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

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <button
        className="fixed top-3.5 left-3.5 z-20 lg:hidden w-8 h-8 flex items-center justify-center rounded-md bg-surface border border-border-default"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={16} className="text-base" />
      </button>

      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        documents={documents}
        user={user}
        onLogout={logout}
        loading={chatsLoading}
        isOpen={mobileMenuOpen}
      />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#f5f4ed]">
        <Chat
          key={chatKey}
          documentId={effectiveDocumentId}
          chatId={activeChatId}
          initialMessages={activeChat?.messages ?? []}
          onMessageSent={handleMessageSent}
          onChatCreated={handleChatCreated}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          documentName={activeChat?.documentName ?? null}
        />
      </main>
    </div>
  );
}

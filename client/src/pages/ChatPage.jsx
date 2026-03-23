import { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Chat from '../components/Chat/Chat.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import Toast from '../components/shared/Toast.jsx';
import GuestLimitModal, { GUEST_CHAT_LIMIT } from '../components/shared/GuestLimitModal.jsx';
import { getChats, createChat as apiCreateChat, updateChatTitle } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// ─── Guest localStorage helpers ───────────────────────────────────────────────
const GUEST_STORAGE_KEY = 'kb_guest_chats';

function loadGuestChats() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveGuestChats(chats) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(chats));
}

// ─── ChatPage ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user;

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  // chatKey controls Chat remounting — separate from activeChatId so that
  // lazily assigning a real chatId (on first message) does NOT remount Chat.
  const [chatKey, setChatKey] = useState('default');
  const [toast, setToast] = useState(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState(null);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const effectiveDocumentId = uploadedDocumentId ?? activeChat?.documentId ?? null;

  // Derive documents list from chats (works for both auth and guest)
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

  // Load chats on mount
  useEffect(() => {
    if (isGuest) {
      setChats(loadGuestChats());
      setChatsLoading(false);
    } else {
      getChats()
        .then(setChats)
        .catch(() => setToast({ message: 'Failed to load chat history.', type: 'error' }))
        .finally(() => setChatsLoading(false));
    }
  }, [isGuest]);

  // Guest createChat — stored in localStorage, enforces limit
  const guestCreateChat = useCallback(async ({ title, documentId = null, documentName = null }) => {
    const saved = loadGuestChats();
    if (saved.length >= GUEST_CHAT_LIMIT) {
      setShowGuestLimitModal(true);
      throw new Error('GUEST_LIMIT');
    }
    const newChat = {
      id: 'g-' + Date.now(),
      title: title || 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      documentId,
      documentName,
    };
    const updated = [newChat, ...saved];
    saveGuestChats(updated);
    setChats(updated);
    return newChat;
  }, []);

  const createChatFn = isGuest ? guestCreateChat : apiCreateChat;

  const handleNewChat = useCallback(() => {
    if (activeChatId === null && chatKey === 'default') return;
    setActiveChatId(null);
    setUploadedDocumentId(null);
    setChatKey('default');
    setMobileMenuOpen(false);
  }, [activeChatId, chatKey]);

  // Called by Chat when it lazily creates a chat on the first message.
  // Does NOT change chatKey — Chat must NOT remount so the user sees the response.
  function handleChatCreated(chat) {
    if (!isGuest) {
      // For auth users, add to list (guest's guestCreateChat already adds to list)
      setChats((prev) => [chat, ...prev]);
    }
    setActiveChatId(chat.id);
  }

  function handleChatSelect(chat) {
    setActiveChatId(chat.id);
    setUploadedDocumentId(null);
    setChatKey(`chat-${chat.id}`);
    setMobileMenuOpen(false);
  }

  async function handleUploadSuccess(res) {
    const name = res?.name || `Document ${res?.documentId}`;
    setUploadedDocumentId(res.documentId);
    setMobileMenuOpen(false);

    if (isGuest) {
      const saved = loadGuestChats();
      if (saved.length >= GUEST_CHAT_LIMIT) {
        setShowGuestLimitModal(true);
        return;
      }
      const newChat = {
        id: 'g-' + Date.now(),
        title: name,
        messages: [],
        createdAt: new Date().toISOString(),
        documentId: res.documentId,
        documentName: name,
      };
      const updated = [newChat, ...saved];
      saveGuestChats(updated);
      setChats(updated);
      setActiveChatId(newChat.id);
      setChatKey(`chat-${newChat.id}`);
    } else {
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
  }

  function handleUploadError(message) {
    setToast({ message: message || 'Upload failed. Please try again.', type: 'error' });
  }

  // Rename — Sidebar calls this, ChatPage handles persistence
  function handleRenameChat(chatId, title) {
    if (isGuest) {
      const updated = loadGuestChats().map((c) => (c.id === chatId ? { ...c, title } : c));
      saveGuestChats(updated);
      setChats(updated);
    } else {
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title } : c)));
      updateChatTitle(chatId, title).catch(() => {});
    }
  }

  // Chat passes the resolved chatId (may differ from activeChatId during lazy creation)
  function handleMessageSent(messages, resolvedChatId) {
    const id = resolvedChatId ?? activeChatId;
    if (!id) return;
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) : 'New Chat';

    if (isGuest) {
      const updated = loadGuestChats().map((c) =>
        c.id === id ? { ...c, title, messages } : c
      );
      saveGuestChats(updated);
      setChats(updated);
    } else {
      setChats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title, messages } : c))
      );
      updateChatTitle(id, title).catch(() => {});
    }
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

      {showGuestLimitModal && (
        <GuestLimitModal onClose={() => setShowGuestLimitModal(false)} />
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
        isGuest={isGuest}
        guestChatsUsed={chats.length}
        onSignIn={() => navigate('/login')}
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
          createChatFn={createChatFn}
        />
      </main>
    </div>
  );
}

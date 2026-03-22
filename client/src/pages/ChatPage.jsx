import { useState, useEffect, useCallback } from 'react';
import Chat from '../components/Chat/Chat.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import Toast from '../components/shared/Toast.jsx';

function loadChats() {
  try {
    return JSON.parse(localStorage.getItem('kb_chats') || '[]');
  } catch {
    return [];
  }
}

export default function ChatPage() {
  const [chats, setChats] = useState(loadChats);
  const [activeChatId, setActiveChatId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [toast, setToast] = useState(null); // { message, type }
  // Tracks the most recently uploaded document — overrides stale chat documentIds
  const [uploadedDocumentId, setUploadedDocumentId] = useState(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  // Use the freshly-uploaded doc if available, otherwise fall back to what's stored in the chat
  const effectiveDocumentId = uploadedDocumentId ?? activeChat?.documentId ?? null;

  // Persist chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kb_chats', JSON.stringify(chats));
  }, [chats]);

  const handleNewChat = useCallback(() => {
    const chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      documentId: null,
      documentName: null,
      messages: [],
    };
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
  }, []);

  function handleChatSelect(chat) {
    setActiveChatId(chat.id);
    // Use the selected chat's own document; clear the upload override
    setUploadedDocumentId(null);
  }

  function handleUploadSuccess(res) {
    const name = res?.name || `Document ${res?.documentId}`;
    const ext = name.split('.').pop().toLowerCase();

    setUploadedDocumentId(res.documentId);

    // Add to documents sidebar (deduplicate)
    setDocuments((prev) => {
      if (prev.some((d) => d.id === res.documentId)) return prev;
      return [...prev, { id: res.documentId, name, fileType: ext }];
    });

    // Create a new chat session linked to this document
    const chatId = Date.now().toString();
    const newChat = {
      id: chatId,
      title: name,
      createdAt: new Date().toISOString(),
      documentId: res.documentId,
      documentName: name,
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(chatId);
  }

  function handleUploadError(message) {
    setToast({ message: message || 'Upload failed. Please try again.', type: 'error' });
  }

  function handleMessageSent(messages) {
    if (!activeChatId) return;
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 50)
      : 'New Chat';
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, title, messages } : c))
    );
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
      />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Chat
          key={activeChatId ?? 'default'}
          documentId={effectiveDocumentId}
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

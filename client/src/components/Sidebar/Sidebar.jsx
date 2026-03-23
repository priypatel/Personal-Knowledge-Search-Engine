import { useState, useEffect, useRef } from 'react';
import { Plus, LogOut, Search, Pencil } from 'lucide-react';
import Badge from '../shared/Badge.jsx';
import { searchChats } from '../../services/api.js';

function groupChatsByDate(chats) {
  const now = new Date();
  const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart      = todayStart - 6 * 86400000;

  const groups = [
    { label: 'TODAY',     items: [] },
    { label: 'YESTERDAY', items: [] },
    { label: 'THIS WEEK', items: [] },
    { label: 'EARLIER',   items: [] },
  ];

  for (const chat of chats) {
    const t = new Date(chat.createdAt).getTime();
    if (t >= todayStart)          groups[0].items.push(chat);
    else if (t >= yesterdayStart) groups[1].items.push(chat);
    else if (t >= weekStart)      groups[2].items.push(chat);
    else                          groups[3].items.push(chat);
  }

  return groups.filter((g) => g.items.length > 0);
}

function getFileType(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf')  return 'pdf';
  if (ext === 'docx') return 'docx';
  return 'txt';
}

function initials(displayName = '') {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Sidebar({
  chats = [],
  activeChat,
  onChatSelect,
  onNewChat,
  onRenameChat,
  documents = [],
  user = null,
  onLogout,
  loading = false,
  isOpen = false,
  isGuest = false,
  guestChatsUsed = 0,
  onSignIn,
}) {
  // Delay transition activation to prevent flash on first render
  const [ready, setReady] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingChatId, setRenamingChatId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef(null);
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Allow CSS transitions only after the first paint — prevents slide-in flash on load
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Debounced API search — fires 300ms after the user stops typing
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    if (isGuest) {
      // Client-side filter for guests (no API access needed)
      const ql = q.toLowerCase();
      setSearchResults(chats.filter((c) => c.title.toLowerCase().includes(ql)));
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      searchChats(q)
        .then((results) => setSearchResults(results))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, isGuest, chats]);

  // Auto-focus rename input when entering rename mode
  useEffect(() => {
    if (renamingChatId) renameInputRef.current?.focus();
  }, [renamingChatId]);

  function startRename(chat, e) {
    e.stopPropagation();
    setRenamingChatId(chat.id);
    setRenameValue(chat.title);
  }

  async function commitRename(chatId) {
    const title = renameValue.trim();
    setRenamingChatId(null);
    if (!title) return;
    onRenameChat?.(chatId, title);
  }

  function handleRenameKeyDown(e, chatId) {
    if (e.key === 'Enter') { e.preventDefault(); commitRename(chatId); }
    if (e.key === 'Escape') { setRenamingChatId(null); }
  }

  return (
    <>
    <aside
      data-testid="sidebar"
      className={`shrink-0 border-r border-border-default bg-surface flex flex-col font-sans h-screen w-[260px] fixed left-0 top-0 z-40 lg:relative lg:z-auto lg:translate-x-0 ${
        ready ? 'transition-transform duration-[250ms] ease-out' : ''
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
            </svg>
          </div>
          <span className="text-[15px] font-medium text-base whitespace-nowrap">Recall</span>
        </div>
        <button
          data-testid="new-chat-button"
          onClick={onNewChat}
          title="New Chat (Ctrl+N)"
          className="w-7 h-7 border border-border-default rounded-md bg-transparent cursor-pointer flex items-center justify-center transition-colors duration-150 hover:bg-muted"
        >
          <Plus size={14} className="text-muted" />
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-border-default shrink-0" />

      {/* Search input */}
      <div className="px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 bg-muted rounded-md px-2.5 py-1.5">
          <Search size={13} className="text-faint shrink-0" />
          <input
            data-testid="chat-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="flex-1 bg-transparent text-[13px] text-base placeholder:text-faint outline-none border-none min-w-0"
          />
        </div>
      </div>

      {/* Chats section — scrollable */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        {loading || searchLoading ? (
          <p className="text-xs text-faint text-center px-3 py-4 m-0">
            {searchLoading ? 'Searching...' : 'Loading...'}
          </p>
        ) : (() => {
          const displayChats = searchResults !== null ? searchResults : chats;

          if (displayChats.length === 0) {
            return (
              <p className="text-xs text-faint text-center px-3 py-4 m-0">
                {searchResults !== null
                  ? `No chats match "${searchQuery}".`
                  : 'No conversations yet. Ask your first question.'}
              </p>
            );
          }

          return groupChatsByDate(displayChats).map((group) => (
            <div key={group.label}>
              <p
                data-testid="date-group-label"
                className="text-[11px] uppercase text-faint px-3 pt-2 pb-1 font-medium tracking-[0.05em] m-0"
              >
                {group.label}
              </p>

              {group.items.map((chat) => {
                const isActive = activeChat?.id === chat.id;
                const isRenaming = renamingChatId === chat.id;
                return (
                  <div
                    key={chat.id}
                    data-testid="chat-history-item"
                    data-active={isActive}
                    onClick={() => !isRenaming && onChatSelect(chat)}
                    className={`group px-3 py-2 rounded-md mx-1 mb-0.5 cursor-pointer text-[13px] transition-colors duration-150 flex items-center gap-1 ${
                      isActive
                        ? 'bg-muted text-primary'
                        : 'bg-transparent text-base hover:bg-muted'
                    }`}
                  >
                    {isRenaming ? (
                      <input
                        ref={renameInputRef}
                        data-testid="rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(chat.id)}
                        onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 bg-surface border border-primary rounded px-1.5 py-0.5 text-[13px] text-base outline-none"
                      />
                    ) : (
                      <>
                        <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis">
                          {chat.title}
                        </span>
                        <button
                          data-testid="rename-button"
                          onClick={(e) => startRename(chat, e)}
                          title="Rename"
                          className="opacity-0 group-hover:opacity-100 shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-border-default transition-opacity duration-100 cursor-pointer"
                        >
                          <Pencil size={11} className="text-muted" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ));
        })()}

        {/* Separator */}
        <div className="h-px bg-border-default mt-3 mb-0 shrink-0" />

        {/* Documents section */}
        <div className="py-3">
          <p className="text-[11px] uppercase text-faint px-3 mb-1.5 font-medium tracking-[0.05em] m-0">
            Documents
          </p>

          {documents.length === 0 ? (
            <p className="text-xs text-faint text-center px-3 py-4 m-0">
              Upload your first document to get started.
            </p>
          ) : (
            documents.map((doc) => {
              const fileType = getFileType(doc.name);
              return (
                <div
                  key={doc.id}
                  data-testid="document-list-item"
                  className="px-3 py-1.5 flex items-center justify-between gap-2 text-[13px]"
                >
                  <span className="overflow-hidden whitespace-nowrap text-ellipsis flex-1 text-base">
                    {doc.name}
                  </span>
                  <Badge type={fileType}>{fileType.toUpperCase()}</Badge>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Guest footer — sign-in CTA */}
      {isGuest && (
        <>
          <div className="h-px bg-border-default shrink-0" />
          <div className="shrink-0 py-3 px-3 flex flex-col gap-2.5">
            <p className="text-xs text-faint m-0">
              {Math.max(0, 3 - guestChatsUsed)} of 3 free chats remaining
            </p>
            <button
              onClick={onSignIn}
              className="w-full bg-primary text-white text-[13px] font-medium rounded-md py-2 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign in for unlimited access
            </button>
          </div>
        </>
      )}

      {/* User profile footer */}
      {user && (
        <>
          <div className="h-px bg-border-default shrink-0" />
          <div className="flex items-center gap-2.5 shrink-0 py-3 px-3">
            {/* Avatar */}
            <div className="w-[30px] h-[30px] rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-[12px] font-medium text-white uppercase">
                {initials(user.displayName)}
              </span>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-base m-0 truncate">{user.displayName}</p>
              <p className="text-[11px] text-faint m-0 truncate">{user.email}</p>
            </div>

            {/* Logout */}
            <button
              data-testid="logout-button"
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out"
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors duration-150 cursor-pointer shrink-0"
            >
              <LogOut size={14} className="text-muted" />
            </button>
          </div>
        </>
      )}
    </aside>

    {/* Logout confirmation dialog */}
    {showLogoutConfirm && (
      <div
        data-testid="logout-confirm-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        onClick={() => setShowLogoutConfirm(false)}
      >
        <div
          className="bg-surface border border-border-default rounded-xl shadow-sm w-[300px] p-5 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <p className="text-sm font-medium text-base m-0">Sign out?</p>
            <p className="text-[13px] text-muted mt-1 m-0">
              You'll need to sign in again to access your chats.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              data-testid="logout-cancel"
              onClick={() => setShowLogoutConfirm(false)}
              className="px-3.5 py-1.5 text-sm text-base border border-border-default rounded-md hover:bg-muted transition-colors duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              data-testid="logout-confirm"
              onClick={() => { onLogout(); setShowLogoutConfirm(false); }}
              className="px-3.5 py-1.5 text-sm text-white bg-primary rounded-md hover:opacity-90 transition-opacity duration-150 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

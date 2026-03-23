import { useState, useEffect, useRef } from 'react';
import { Plus, LogOut, Search, Pencil, MessageSquare, FileText, Zap } from 'lucide-react';
import Badge from '../shared/Badge.jsx';
import { searchChats } from '../../services/api.js';

function groupChatsByDate(chats) {
  const now = new Date();
  const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart      = todayStart - 6 * 86400000;

  const groups = [
    { label: 'Today',     items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This week', items: [] },
    { label: 'Earlier',   items: [] },
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
  const [ready, setReady] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingChatId, setRenamingChatId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    if (isGuest) {
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

  const displayChats = searchResults !== null ? searchResults : chats;

  return (
    <>
    <aside
      data-testid="sidebar"
      className={`shrink-0 bg-[#f7f7f5] flex flex-col font-sans h-screen w-[268px] fixed left-0 top-0 z-40 lg:relative lg:z-auto lg:translate-x-0 border-r border-black/[0.06] ${
        ready ? 'transition-transform duration-[250ms] ease-out' : ''
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-base tracking-tight">Recall</span>
          </div>

          <button
            data-testid="new-chat-button"
            onClick={onNewChat}
            title="New Chat (Ctrl+N)"
            className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus size={14} className="text-primary" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-black/[0.08] rounded-xl px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Search size={13} className="text-faint shrink-0" />
          <input
            data-testid="chat-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-[13px] text-base placeholder:text-faint outline-none border-none min-w-0"
          />
        </div>
      </div>

      {/* ── New Chat shortcut pill ──────────────────────────────────────── */}
      <div className="px-4 pb-3 shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 bg-white border border-black/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-muted hover:border-primary/30 hover:text-primary hover:bg-primary/[0.03] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer group"
        >
          <div className="w-5 h-5 rounded-md bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors shrink-0">
            <MessageSquare size={11} className="text-primary" />
          </div>
          <span>New conversation</span>
        </button>
      </div>

      {/* ── Scrollable area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2">

        {/* Chat history */}
        <div className="mb-1">
          {loading || searchLoading ? (
            <p className="text-xs text-faint text-center px-3 py-6">
              {searchLoading ? 'Searching...' : 'Loading...'}
            </p>
          ) : displayChats.length === 0 ? (
            <p className="text-xs text-faint text-center px-3 py-6">
              {searchResults !== null
                ? `No chats match "${searchQuery}".`
                : 'No conversations yet.'}
            </p>
          ) : (
            groupChatsByDate(displayChats).map((group) => (
              <div key={group.label} className="mb-1">
                <p className="text-[11px] text-faint px-2 pt-3 pb-1 font-semibold tracking-wide uppercase m-0">
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
                      className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-xl mb-0.5 cursor-pointer text-[13px] transition-all duration-150 ${
                        isActive
                          ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-primary font-medium border border-black/[0.06]'
                          : 'text-base hover:bg-white/70'
                      }`}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-full" />
                      )}

                      <MessageSquare size={13} className={isActive ? 'text-primary shrink-0' : 'text-faint shrink-0'} />

                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          data-testid="rename-input"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(chat.id)}
                          onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 bg-white border border-primary rounded-md px-1.5 py-0.5 text-[13px] text-base outline-none"
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
                            className="opacity-0 group-hover:opacity-100 shrink-0 w-5 h-5 flex items-center justify-center rounded-md hover:bg-black/5 transition-all cursor-pointer"
                          >
                            <Pencil size={11} className="text-muted" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Documents section ──────────────────────────────────────────── */}
        <div className="mt-2 mb-3">
          <div className="flex items-center gap-1.5 px-2 pt-2 pb-1.5">
            <FileText size={11} className="text-faint" />
            <p className="text-[11px] text-faint font-semibold tracking-wide uppercase m-0">Documents</p>
          </div>

          {documents.length === 0 ? (
            <p className="text-xs text-faint text-center px-3 py-4 m-0">
              Upload a document to get started.
            </p>
          ) : (
            documents.map((doc) => {
              const fileType = getFileType(doc.name);
              return (
                <div
                  key={doc.id}
                  data-testid="document-list-item"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/70 transition-colors text-[13px] mb-0.5"
                >
                  <div className="w-6 h-6 rounded-md bg-white border border-black/[0.08] flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <FileText size={11} className="text-muted" />
                  </div>
                  <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis text-base">
                    {doc.name}
                  </span>
                  <Badge type={fileType}>{fileType.toUpperCase()}</Badge>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Guest footer ───────────────────────────────────────────────── */}
      {isGuest && (
        <div className="shrink-0 px-3 py-3 border-t border-black/[0.06]">
          <div className="bg-primary/[0.06] rounded-xl p-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Zap size={13} className="text-primary shrink-0" />
              <p className="text-[12px] text-primary font-medium m-0">
                {Math.max(0, 3 - guestChatsUsed)} of 3 free chats left
              </p>
            </div>
            <button
              onClick={onSignIn}
              className="w-full bg-primary text-white text-[13px] font-medium rounded-lg py-2 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign in for unlimited access
            </button>
          </div>
        </div>
      )}

      {/* ── User profile footer ─────────────────────────────────────────── */}
      {user && (
        <div className="shrink-0 px-3 py-3 border-t border-black/[0.06]">
          <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-[12px] font-semibold text-white uppercase">
                {initials(user.displayName)}
              </span>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-base m-0 truncate leading-tight">{user.displayName}</p>
              <p className="text-[11px] text-faint m-0 truncate leading-tight">{user.email}</p>
            </div>

            {/* Logout */}
            <button
              data-testid="logout-button"
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer shrink-0 group"
            >
              <LogOut size={14} className="text-muted group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      )}
    </aside>

    {/* ── Logout confirmation dialog ──────────────────────────────────── */}
    {showLogoutConfirm && (
      <div
        data-testid="logout-confirm-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
        onClick={() => setShowLogoutConfirm(false)}
      >
        <div
          className="bg-white border border-black/[0.08] rounded-2xl shadow-xl w-[300px] p-5 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-base m-0">Sign out?</p>
              <p className="text-[13px] text-muted mt-0.5 m-0 leading-relaxed">
                You'll need to sign in again to access your chats.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              data-testid="logout-cancel"
              onClick={() => setShowLogoutConfirm(false)}
              className="px-4 py-1.5 text-[13px] text-base border border-black/[0.1] rounded-lg hover:bg-black/[0.03] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              data-testid="logout-confirm"
              onClick={() => { onLogout(); setShowLogoutConfirm(false); }}
              className="px-4 py-1.5 text-[13px] text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
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

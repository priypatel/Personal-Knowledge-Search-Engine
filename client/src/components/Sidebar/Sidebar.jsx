import { useState } from 'react';
import { Plus, LogOut } from 'lucide-react';
import Badge from '../shared/Badge.jsx';

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
  documents = [],
  user = null,
  onLogout,
  loading = false,
  isOpen = true,
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <>
    <aside
      data-testid="sidebar"
      className="w-[260px] shrink-0 border-r border-border-default bg-surface flex flex-col h-screen font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 shrink-0">
        <span className="text-[15px] font-medium text-base">Knowbase</span>
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

      {/* Chats section — scrollable */}
      <div className="flex-1 overflow-y-auto py-3 min-h-0">
        <p className="text-[11px] uppercase text-faint px-3 mb-1.5 font-medium tracking-[0.05em] m-0">
          Chats
        </p>

        {loading ? (
          <p className="text-xs text-faint text-center px-3 py-4 m-0">Loading...</p>
        ) : chats.length === 0 ? (
          <p className="text-xs text-faint text-center px-3 py-4 m-0">
            No conversations yet. Ask your first question.
          </p>
        ) : (
          groupChatsByDate(chats).map((group) => (
            <div key={group.label}>
              <p
                data-testid="date-group-label"
                className="text-[11px] uppercase text-faint px-3 pt-2 pb-1 font-medium tracking-[0.05em] m-0"
              >
                {group.label}
              </p>

              {group.items.map((chat) => {
                const isActive = activeChat?.id === chat.id;
                return (
                  <div
                    key={chat.id}
                    data-testid="chat-history-item"
                    data-active={isActive}
                    onClick={() => onChatSelect(chat)}
                    className={`px-3 py-2 rounded-md mx-1 mb-0.5 cursor-pointer text-[13px] overflow-hidden whitespace-nowrap text-ellipsis transition-colors duration-150 ${
                      isActive
                        ? 'bg-muted text-primary'
                        : 'bg-transparent text-base hover:bg-muted'
                    }`}
                  >
                    {chat.title}
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Separator */}
        <div className="h-px bg-border-default mt-3 mb-0 shrink-0" />

        {/* Documents section */}
        <div className="py-3">
          <p className="text-[11px] uppercase text-faint px-3 mb-1.5 font-medium tracking-[0.05em] m-0">
            Documents
          </p>

          {documents.length === 0 ? (
            <p className="text-xs text-faint text-center px-3 py-4 m-0">
              No documents uploaded yet.
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

      {/* User profile footer */}
      {user && (
        <>
          <div className="h-px bg-border-default shrink-0" />
          <div className="flex items-center gap-2.5 px-3 py-3 shrink-0">
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

import { Plus } from 'lucide-react';
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

export default function Sidebar({
  chats = [],
  activeChat,
  onChatSelect,
  onNewChat,
  documents = [],
  isOpen = true,
}) {
  if (!isOpen) return null;

  return (
    <aside
      data-testid="sidebar"
      className="w-[260px] shrink-0 border-r border-border-default bg-surface flex flex-col h-screen overflow-y-auto font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 shrink-0">
        <span className="text-[15px] font-semibold text-base">Knowbase</span>
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

      {/* Chats section */}
      <div className="py-3 shrink-0">
        <p className="text-[11px] uppercase text-faint px-3 mb-1.5 font-medium tracking-[0.05em] m-0">
          Chats
        </p>

        {chats.length === 0 ? (
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
      </div>

      {/* Separator */}
      <div className="h-px bg-border-default shrink-0" />

      {/* Documents section */}
      <div className="py-3 flex-1">
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
    </aside>
  );
}

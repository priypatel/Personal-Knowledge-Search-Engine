import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, SendHorizontal } from 'lucide-react';
import { sendChat } from '../../services/api.js';
import Suggestions from '../Suggestions/Suggestions.jsx';

let _msgId = 0;
const nextId = () => ++_msgId;

// ─── Spinner ──────────────────────────────────────────────────────────────────

function SearchSpinner() {
  return (
    <>
      <style>{`@keyframes kb-spin { to { transform: rotate(360deg); } }`}</style>
      <span
        style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          border: '2px solid var(--primary)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'kb-spin 0.8s linear infinite',
          marginRight: 6,
          verticalAlign: 'middle',
        }}
      />
    </>
  );
}

// ─── Citation Pills ───────────────────────────────────────────────────────────

function CitationPills({ sources }) {
  if (!sources || sources.length === 0) return null;

  // Deduplicate by documentId
  const seen = new Set();
  const unique = sources.filter((s) => {
    if (seen.has(s.documentId)) return false;
    seen.add(s.documentId);
    return true;
  });

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {unique.map((s, i) => (
        <span
          key={s.chunkId}
          data-testid="citation-pill"
          style={{
            background: i === 0 ? 'var(--primary-light)' : '#E1F5EE',
            color: i === 0 ? 'var(--primary-dark)' : '#085041',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
          }}
        >
          [{i + 1}] {s.documentName}
        </span>
      ))}
    </div>
  );
}

// ─── Input Bar ────────────────────────────────────────────────────────────────

function InputBar({ value, onChange, onSend, disabled, inputRef }) {
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleInput(e) {
    const el = e.target;
    el.style.height = 'auto';
    const lineHeight = 24;
    el.style.height = Math.min(el.scrollHeight, lineHeight * 5) + 'px';
    onChange(el.value);
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        border: '0.5px solid var(--border-hover)',
        borderRadius: 16,
        padding: '10px 12px',
        background: 'var(--bg-primary)',
      }}
    >
      <textarea
        ref={inputRef}
        data-testid="message-input"
        value={value}
        onInput={handleInput}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your documents..."
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: '24px',
          fontFamily: 'var(--font-sans)',
        }}
      />
      <button
        data-testid="send-button"
        type="button"
        onClick={onSend}
        disabled={!canSend}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: canSend ? 'var(--primary)' : 'var(--primary)',
          border: 'none',
          cursor: canSend ? 'pointer' : 'not-allowed',
          opacity: canSend ? 1 : 0.4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'opacity 150ms',
        }}
      >
        <SendHorizontal size={16} color="white" />
      </button>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export default function Chat({ documentId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Press "/" to focus the input
  useEffect(() => {
    function handler(e) {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSuggestionClick = useCallback((question) => {
    setInputValue(question);
    inputRef.current?.focus();
  }, []);

  async function handleSend() {
    const query = inputValue.trim();
    if (!query || isLoading) return;

    const userMsgId = nextId();
    const placeholderId = nextId();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: query },
      { id: placeholderId, role: 'assistant', content: '', searchStatus: 'Searching your documents...' },
    ]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await sendChat(query, documentId ?? null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? { ...m, content: data.answer, sources: data.sources, searchStatus: null }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? { ...m, content: 'Something went wrong. Please try again.', searchStatus: null }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  // ── Landing state ────────────────────────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div
        data-testid="landing-view"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <Search size={48} style={{ color: 'var(--primary)' }} />
        <h2 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
          What do you want to know?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
          Search across your documents with AI-powered answers.
        </p>

        <div style={{ width: '100%', maxWidth: 520 }}>
          <InputBar
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            disabled={isLoading}
            inputRef={inputRef}
          />
        </div>

        <Suggestions documentId={documentId} onSuggestionClick={handleSuggestionClick} />

        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
          Press / to focus search
        </p>
      </div>
    );
  }

  // ── Active chat state ────────────────────────────────────────────────────────
  return (
    <div
      data-testid="chat-container"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Message area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px' }}>
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div
                key={msg.id}
                style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}
              >
                <div
                  data-testid="user-message"
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: '16px 16px 4px 16px',
                    maxWidth: 420,
                    padding: '12px 16px',
                    fontSize: 14,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          }

          // Assistant message
          return (
            <div
              key={msg.id}
              style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}
            >
              <div style={{ maxWidth: 520 }}>
                {msg.searchStatus ? (
                  <p
                    data-testid="search-status"
                    style={{ fontSize: 12, color: 'var(--primary)', margin: 0 }}
                  >
                    <SearchSpinner />
                    {msg.searchStatus}
                  </p>
                ) : (
                  <>
                    <p
                      data-testid="ai-response"
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: 'var(--text-primary)',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </p>
                    <CitationPills sources={msg.sources} />
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Pinned input bar */}
      <div style={{ padding: '8px 24px 24px', flexShrink: 0 }}>
        <InputBar
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isLoading}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}

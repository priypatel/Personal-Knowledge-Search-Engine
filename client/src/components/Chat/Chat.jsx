import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, SendHorizontal, Paperclip, Copy, Check } from 'lucide-react';
import { sendChat, uploadDocument } from '../../services/api.js';
import Suggestions from '../Suggestions/Suggestions.jsx';
import Upload from '../Upload/Upload.jsx';

let _msgId = 0;
const nextId = () => ++_msgId;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLoader() {
  return (
    <>
      <style>{`
        @keyframes kb-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .kb-skeleton { animation: kb-pulse 1.5s ease-in-out infinite; }
      `}</style>
      <div className="flex flex-col gap-2 w-full">
        {[100, 85, 60].map((w, i) => (
          <div
            key={i}
            className="kb-skeleton h-[13px] bg-muted rounded-sm"
            style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </>
  );
}

// ─── Citation Pills ───────────────────────────────────────────────────────────

function CitationPills({ sources }) {
  if (!sources || sources.length === 0) return null;

  const seen = new Set();
  const unique = sources.filter((s) => {
    if (seen.has(s.documentId)) return false;
    seen.add(s.documentId);
    return true;
  });

  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {unique.map((s, i) => (
        <span
          key={s.chunkId}
          data-testid="citation-pill"
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
            i === 0
              ? 'bg-primary-light text-primary-dark'
              : 'bg-[#E1F5EE] text-[#085041]'
          }`}
        >
          [{i + 1}] {s.documentName}
        </span>
      ))}
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for test environments without clipboard API
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      data-testid="copy-button"
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 text-faint hover:text-muted transition-colors duration-150"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

// ─── Chat Header ──────────────────────────────────────────────────────────────

function ChatHeader({ messages, documentName }) {
  const title =
    messages.find((m) => m.role === 'user')?.content.slice(0, 50) ||
    documentName ||
    'New Chat';

  const sourceCount = new Set(
    messages.flatMap((m) => (m.sources || []).map((s) => s.documentId))
  ).size;

  return (
    <div
      data-testid="chat-header"
      className="flex items-center gap-3 px-6 py-3 border-b border-border-default shrink-0"
    >
      <span className="text-sm font-medium text-base truncate flex-1">{title}</span>
      {sourceCount > 0 && (
        <span className="text-[11px] font-medium bg-muted text-muted px-2 py-0.5 rounded-[10px] shrink-0">
          {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
        </span>
      )}
    </div>
  );
}

// ─── Input Bar ────────────────────────────────────────────────────────────────

function InputBar({ value, onChange, onSend, disabled, inputRef, placeholder, onUploadClick }) {
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleInput(e) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 24 * 5) + 'px';
    onChange(el.value);
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="border border-border-strong rounded-xl px-4 pt-3 pb-2.5 bg-surface">
      <textarea
        ref={inputRef}
        data-testid="message-input"
        value={value}
        onInput={handleInput}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Ask anything about your documents...'}
        rows={1}
        className="flex-1 w-full resize-none border-none outline-none bg-transparent text-sm text-base leading-6 font-sans"
      />
      <div className="flex items-center gap-2 mt-2">
        {onUploadClick && (
          <>
            <button
              data-testid="upload-trigger"
              type="button"
              onClick={onUploadClick}
              className="flex items-center gap-1 border border-border-default rounded-md px-2 py-1 text-[12px] text-muted hover:bg-muted transition-colors duration-150 cursor-pointer"
            >
              <Paperclip size={12} />
              Upload
            </button>
            {['PDF', 'DOCX', 'TXT'].map((t) => (
              <span
                key={t}
                className="text-[11px] text-faint px-1.5 py-0.5 bg-muted rounded-[10px]"
              >
                {t}
              </span>
            ))}
          </>
        )}
        <div className="ml-auto">
          <button
            data-testid="send-button"
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={`w-8 h-8 rounded-full bg-primary border-none flex items-center justify-center shrink-0 transition-opacity duration-150 ${
              canSend ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <SendHorizontal size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export default function Chat({
  documentId,
  initialMessages = [],
  onMessageSent,
  onUploadSuccess,
  onUploadError,
  documentName = null,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const uploadInputRef = useRef(null);

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

    const userMsg = { id: nextId(), role: 'user', content: query };
    const placeholder = {
      id: nextId(),
      role: 'assistant',
      content: '',
      searchStatus: 'Searching your documents...',
    };

    const withPlaceholder = [...messages, userMsg, placeholder];
    setMessages(withPlaceholder);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await sendChat(query, documentId ?? null);
      const resolved = withPlaceholder.map((m) =>
        m.id === placeholder.id
          ? { ...m, content: data.answer, sources: data.sources, searchStatus: null }
          : m
      );
      setMessages(resolved);
      onMessageSent?.(resolved);
    } catch (err) {
      const content = !err.response
        ? 'Connection issue. Please try again.'
        : 'Something went wrong. Please try again.';
      const errored = withPlaceholder.map((m) =>
        m.id === placeholder.id ? { ...m, content, searchStatus: null } : m
      );
      setMessages(errored);
      onMessageSent?.(errored);
    } finally {
      setIsLoading(false);
    }
  }

  // Active-state upload via hidden file input
  async function handleActiveUploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    try {
      const response = await uploadDocument(file);
      onUploadSuccess?.(response);
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || 'Upload failed. Please try again.';
      onUploadError?.(msg);
    }
  }

  // ── Landing state ────────────────────────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div
        data-testid="landing-view"
        className="flex flex-col items-center justify-center gap-4 p-[40px_24px] text-center h-full"
      >
        <Search size={48} className="text-primary" />
        <h2 className="text-[22px] font-medium text-base m-0">
          What do you want to know?
        </h2>
        <p className="text-sm text-muted m-0">
          Search across your documents with AI-powered answers.
        </p>

        {/* Upload zone */}
        <div className="w-full max-w-[480px]">
          <Upload onUploadSuccess={onUploadSuccess} onUploadError={onUploadError} />
        </div>

        <div className="w-full max-w-[520px]">
          <InputBar
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            disabled={isLoading}
            inputRef={inputRef}
          />
        </div>

        <Suggestions documentId={documentId} onSuggestionClick={handleSuggestionClick} />

        <p className="text-xs text-faint mt-2">Press / to focus search</p>
      </div>
    );
  }

  // ── Active chat state ────────────────────────────────────────────────────────
  return (
    <div
      data-testid="chat-container"
      className="flex flex-col h-full"
    >
      {/* Chat header */}
      <ChatHeader messages={messages} documentName={documentName} />

      {/* Hidden file input for active-state upload */}
      <input
        ref={uploadInputRef}
        data-testid="active-upload-input"
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleActiveUploadFile}
      />

      {/* Message area */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-[24px_24px_16px]"
      >
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end mb-5">
                <div
                  data-testid="user-message"
                  className="bg-primary text-white rounded-[16px_16px_4px_16px] max-w-[420px] px-4 py-3 text-sm"
                >
                  {msg.content}
                </div>
              </div>
            );
          }

          // Assistant message
          const isError =
            msg.content === 'Connection issue. Please try again.' ||
            msg.content === 'Something went wrong. Please try again.' ||
            msg.content === 'No relevant data found in your documents.';

          return (
            <div key={msg.id} className="flex justify-start mb-5">
              <div className="max-w-[520px] w-full">
                {msg.searchStatus ? (
                  <div data-testid="search-status">
                    <SkeletonLoader />
                  </div>
                ) : (
                  <>
                    <p
                      data-testid="ai-response"
                      className={`text-sm leading-[1.7] m-0 whitespace-pre-wrap ${
                        isError
                          ? 'bg-error-bg text-error px-3.5 py-2.5 rounded-md'
                          : 'text-base'
                      }`}
                    >
                      {msg.content}
                    </p>
                    {!isError && <CitationPills sources={msg.sources} />}
                    {!isError && msg.content && (
                      <div className="flex items-center gap-3 mt-2">
                        <CopyButton text={msg.content} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Pinned input bar */}
      <div className="px-6 pb-6 pt-2 shrink-0">
        <InputBar
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isLoading}
          inputRef={inputRef}
          placeholder="Follow up or ask something new..."
          onUploadClick={onUploadSuccess ? () => uploadInputRef.current?.click() : undefined}
        />
      </div>
    </div>
  );
}

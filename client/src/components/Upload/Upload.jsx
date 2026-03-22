import { useState, useRef } from 'react';
import { uploadDocument } from '../../services/api.js';

const ACCEPTED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function Spinner() {
  return (
    <>
      <style>{`@keyframes kb-spin { to { transform: rotate(360deg); } }`}</style>
      <div
        className="w-6 h-6 rounded-token border-2 border-muted border-t-primary mx-auto mb-sm"
        style={{ animation: 'kb-spin 0.8s linear infinite' }}
      />
    </>
  );
}

export default function Upload({ onUploadSuccess }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | processing | ready | error
  const [errorMessage, setErrorMessage] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  function validateFile(file) {
    if (!ACCEPTED_MIMES.has(file.type)) {
      return 'File type not supported. Use PDF, DOCX, or TXT.';
    }
    if (file.size > MAX_SIZE) {
      return 'File size exceeds the 10MB limit.';
    }
    return null;
  }

  async function handleFile(file) {
    const err = validateFile(file);
    if (err) {
      setStatus('error');
      setErrorMessage(err);
      return;
    }

    setDocumentName(file.name);
    setErrorMessage('');
    setStatus('uploading');

    const processingTimer = setTimeout(() => {
      setStatus((s) => (s === 'uploading' ? 'processing' : s));
    }, 800);

    try {
      const response = await uploadDocument(file);
      clearTimeout(processingTimer);
      setStatus('ready');
      onUploadSuccess?.(response);
    } catch (apiErr) {
      clearTimeout(processingTimer);
      const msg =
        apiErr?.response?.data?.error ||
        apiErr?.message ||
        'Upload failed. Please try again.';
      setStatus('error');
      setErrorMessage(msg);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRetry() {
    setStatus('idle');
    setErrorMessage('');
    setDocumentName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const zoneBase =
    'flex flex-col items-center justify-center min-h-[140px] rounded-lg border border-dashed p-2xl text-center transition-colors duration-200';

  const zoneColor = isDragging
    ? 'bg-primary-light border-primary'
    : 'bg-muted border-border-strong';

  const zoneCursor = status === 'idle' ? 'cursor-pointer' : 'cursor-default';

  return (
    <div
      data-testid="upload-zone"
      className={`${zoneBase} ${zoneColor} ${zoneCursor}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => status === 'idle' && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        data-testid="file-input"
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Idle ─────────────────────────────────────────── */}
      {status === 'idle' && (
        <div className="flex flex-col items-center gap-sm">
          {/* Cloud / upload icon */}
          <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-xs">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>

          <p className="text-sm text-muted leading-snug">
            Drag and drop your file here, or
          </p>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="px-lg py-sm bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors duration-150 cursor-pointer"
          >
            Browse files
          </button>

          <p className="text-xs text-faint mt-xs">PDF, DOCX, TXT — max 10MB</p>
        </div>
      )}

      {/* ── Uploading / Processing ────────────────────────── */}
      {(status === 'uploading' || status === 'processing') && (
        <div data-testid="status-indicator" className="flex flex-col items-center gap-sm">
          <Spinner />
          <p className="text-sm text-base font-medium">
            {status === 'uploading' ? 'Uploading...' : 'Processing...'}
          </p>
          <p className="text-xs text-faint">{documentName}</p>
        </div>
      )}

      {/* ── Ready ────────────────────────────────────────── */}
      {status === 'ready' && (
        <div data-testid="status-indicator" className="flex flex-col items-center gap-sm">
          <div className="w-8 h-8 rounded-token bg-success-bg flex items-center justify-center mx-auto">
            <svg
              className="w-4 h-4 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-success">Ready to search</p>
          <p className="text-xs text-faint">{documentName}</p>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────── */}
      {status === 'error' && (
        <div data-testid="status-indicator" className="flex flex-col items-center gap-sm w-full">
          <div className="flex items-center gap-xs bg-error-bg text-error text-sm px-md py-sm rounded-md w-full justify-center">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button
            data-testid="retry-button"
            type="button"
            onClick={(e) => { e.stopPropagation(); handleRetry(); }}
            className="text-sm text-muted border border-border-strong rounded-md px-md py-xs hover:bg-muted transition-colors duration-150 cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

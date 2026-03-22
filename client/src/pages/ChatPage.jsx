import { useState } from 'react';
import Chat from '../components/Chat/Chat.jsx';
import Upload from '../components/Upload/Upload.jsx';

export default function ChatPage() {
  const [documentId, setDocumentId] = useState(null);

  function handleUploadSuccess(res) {
    if (res?.documentId) {
      setDocumentId(res.documentId);
    }
  }

  return (
    <div
      data-testid="chat-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Upload zone */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '32px auto 0',
          padding: '0 24px',
        }}
      >
        <Upload onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Chat documentId={documentId} />
      </div>
    </div>
  );
}

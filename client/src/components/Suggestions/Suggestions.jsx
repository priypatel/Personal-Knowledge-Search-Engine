import { useState, useEffect } from 'react';
import { getSuggestions } from '../../services/api.js';

export default function Suggestions({ documentId, onSuggestionClick }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!documentId) return;
    getSuggestions(documentId)
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [documentId]);

  if (suggestions.length === 0) return null;

  return (
    <div
      data-testid="suggestions-container"
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}
    >
      {suggestions.map((s) => (
        <button
          key={s.id}
          data-testid="suggestion-pill"
          type="button"
          onClick={() => onSuggestionClick(s.question)}
          style={{
            border: '0.5px solid var(--border-default)',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            background: 'none',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          {s.question}
        </button>
      ))}
    </div>
  );
}

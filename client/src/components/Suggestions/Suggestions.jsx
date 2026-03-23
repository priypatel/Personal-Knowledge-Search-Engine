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
      className="flex flex-col md:flex-row flex-wrap gap-2 justify-center"
    >
      {suggestions.map((s) => (
        <button
          key={s.id}
          data-testid="suggestion-pill"
          type="button"
          onClick={() => onSuggestionClick(s.question)}
          className="border border-border-default rounded-[20px] px-[14px] py-[6px] text-xs text-muted bg-transparent cursor-pointer hover:bg-muted transition-colors duration-150 whitespace-nowrap"
        >
          {s.question}
        </button>
      ))}
    </div>
  );
}

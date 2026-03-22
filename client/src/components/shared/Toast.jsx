import { useEffect } from 'react';

const typeClass = {
  error:   'bg-error-bg text-error',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
};

export default function Toast({ message, type = 'error', onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <>
      <style>{`
        @keyframes kb-toast-in {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .kb-toast { animation: kb-toast-in 200ms ease-out; }
      `}</style>
      <div
        data-testid="toast"
        role="alert"
        className={`kb-toast fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-md shadow-lg max-w-[360px] font-sans text-sm ${typeClass[type] ?? typeClass.error}`}
      >
        <span className="flex-1">{message}</span>
        <button
          data-testid="toast-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="bg-transparent border-none cursor-pointer text-inherit text-lg leading-none pl-2 opacity-70 shrink-0 hover:opacity-100 transition-opacity duration-150"
        >
          ×
        </button>
      </div>
    </>
  );
}

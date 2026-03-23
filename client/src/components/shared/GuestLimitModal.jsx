import { useNavigate } from 'react-router-dom';

export const GUEST_CHAT_LIMIT = 3;

export default function GuestLimitModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div
      data-testid="guest-limit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-default rounded-xl w-full max-w-[340px] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
        </div>

        <div>
          <p className="text-sm font-medium text-base m-0">
            You've used your {GUEST_CHAT_LIMIT} free chats
          </p>
          <p className="text-[13px] text-muted mt-1 m-0">
            Sign in to get unlimited access, save your chats, and upload documents.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/login')}
            className="flex-1 bg-primary text-white text-sm font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="flex-1 border border-border-strong text-base text-sm font-medium rounded-lg py-2.5 hover:bg-muted transition-colors cursor-pointer"
          >
            Create account
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-[13px] text-faint hover:text-muted text-center transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

function Logo() {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
        </svg>
      </div>
      <span className="text-[14px] font-semibold text-base tracking-tight">Recall</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const inputCls =
    'w-full border border-border-strong rounded-lg px-3.5 py-2.5 text-sm text-base bg-white outline-none focus:border-primary transition-colors placeholder:text-faint';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] px-4 py-10">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl px-10 py-12">
        <Logo />

        {done ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-base text-center">Password updated!</h1>
            <p className="text-sm text-muted text-center">
              Your password has been changed. Redirecting to sign in…
            </p>
            <Link to="/login" className="text-sm text-primary hover:underline font-medium">
              Go to sign in now
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-base mb-1">New Password</h1>
            <p className="text-sm text-muted mb-7">Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-error-bg text-error text-[13px] px-3.5 py-2.5 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 shrink-0 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-base" htmlFor="rp-password">
                    New Password
                  </label>
                  <span className="text-[11px] text-faint">min. 8 characters</span>
                </div>
                <input
                  id="rp-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-base" htmlFor="rp-confirm">
                  Confirm Password
                </label>
                <input
                  id="rp-confirm"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 bg-primary text-white text-sm font-semibold rounded-lg py-2.5 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'SET NEW PASSWORD'}
              </button>
            </form>

            <p className="text-[13px] text-muted text-center mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

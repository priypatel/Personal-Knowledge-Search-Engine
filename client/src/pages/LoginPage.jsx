import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] px-4 py-10">
      <div className="w-full max-w-[800px] flex rounded-2xl shadow-2xl overflow-hidden h-[580px]">

        {/* ── Left: Form panel ───────────────────────────────────────── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-10 py-12">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </div>
            <span className="text-[14px] font-semibold text-base tracking-tight">Knowbase</span>
          </div>

          <h1 className="text-2xl font-bold text-base mb-1">Sign In</h1>
          <p className="text-sm text-muted mb-7">Welcome back! Please enter your details.</p>

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
              <label className="text-[13px] font-medium text-base" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="border border-border-strong rounded-lg px-3.5 py-2.5 text-sm text-base bg-white outline-none focus:border-primary transition-colors placeholder:text-faint"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-base" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="border border-border-strong rounded-lg px-3.5 py-2.5 text-sm text-base bg-white outline-none focus:border-primary transition-colors placeholder:text-faint"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 bg-primary text-white text-sm font-semibold rounded-lg py-2.5 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>

          {/* Mobile-only register link */}
          <p className="text-[13px] text-muted text-center mt-6 sm:hidden">
            No account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">Create one free</Link>
          </p>
        </div>

        {/* ── Right: Brand panel ─────────────────────────────────────── */}
        <div className="hidden sm:flex w-[280px] lg:w-[320px] shrink-0 bg-primary flex-col items-center justify-center px-8 py-12 relative overflow-hidden text-center">
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-white/5" />

          <div className="relative z-10">
            <h2 className="text-white text-2xl font-bold mb-3">Hey There!</h2>
            <p className="text-white/70 text-sm leading-relaxed mb-8">
              New here? Create an account and start your journey with us.
            </p>
            <Link
              to="/register"
              className="inline-block border-2 border-white text-white text-sm font-semibold px-8 py-2.5 rounded-full hover:bg-white hover:text-primary transition-colors"
            >
              SIGN UP
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

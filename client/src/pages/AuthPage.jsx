import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import './AuthPage.css';

// ─── Logo mark ────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
      </div>
      <span className="text-[14px] font-semibold text-base tracking-tight">Knowbase</span>
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="bg-error-bg text-error text-[13px] px-3.5 py-2.5 rounded-lg flex items-start gap-2 mb-1">
      <svg className="w-4 h-4 shrink-0 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive initial mode from URL
  const [isSignUp, setIsSignUp] = useState(location.pathname === '/register');

  // Sign-in state
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siError, setSiError] = useState('');
  const [siLoading, setSiLoading] = useState(false);

  // Sign-up state
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suError, setSuError] = useState('');
  const [suLoading, setSuLoading] = useState(false);

  function switchTo(mode) {
    setIsSignUp(mode === 'signup');
    navigate(mode === 'signup' ? '/register' : '/login', { replace: true });
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setSiError('');
    setSiLoading(true);
    try {
      await login(siEmail, siPassword);
      navigate('/', { replace: true });
    } catch (err) {
      setSiError(err?.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setSiLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setSuError('');
    if (suPassword.length < 8) {
      setSuError('Password must be at least 8 characters.');
      return;
    }
    setSuLoading(true);
    try {
      await register(suEmail, suName, suPassword);
      navigate('/', { replace: true });
    } catch (err) {
      setSuError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSuLoading(false);
    }
  }

  const inputCls = "w-full border border-border-strong rounded-lg px-3.5 py-2.5 text-sm text-base bg-white outline-none focus:border-primary transition-colors placeholder:text-faint";
  const labelCls = "text-[13px] font-medium text-base";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] px-4 py-10">
      <div className={`auth-container${isSignUp ? ' signup-active' : ''}`}>

        {/* ── Sign-In Form (left side by default) ─────────────────────── */}
        <div className="auth-form-panel auth-signin-panel">
          <Logo />
          <h1 className="text-2xl font-bold text-base mb-1">Sign In</h1>
          <p className="text-sm text-muted mb-6">Welcome back! Please enter your details.</p>

          <form onSubmit={handleSignIn} className="flex flex-col gap-3.5">
            <ErrorBanner message={siError} />

            <div className="flex flex-col gap-1.5">
              <label className={labelCls} htmlFor="si-email">Email Address</label>
              <input id="si-email" type="email" value={siEmail}
                onChange={e => setSiEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className={inputCls} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls} htmlFor="si-password">Password</label>
              <input id="si-password" type="password" value={siPassword}
                onChange={e => setSiPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                className={inputCls} />
            </div>

            <button type="submit" disabled={siLoading}
              className="mt-1 bg-primary text-white text-sm font-semibold rounded-lg py-2.5 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
              {siLoading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>

          {/* Mobile toggle */}
          <p className="text-[13px] text-muted text-center mt-6 sm:hidden">
            No account?{' '}
            <button onClick={() => switchTo('signup')}
              className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-none p-0">
              Create one free
            </button>
          </p>
        </div>

        {/* ── Sign-Up Form (slides in from left) ───────────────────────── */}
        <div className="auth-form-panel auth-signup-panel">
          <Logo />
          <h1 className="text-2xl font-bold text-base mb-1">Create Account</h1>
          <p className="text-sm text-muted mb-5">Start searching your documents with AI.</p>

          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            <ErrorBanner message={suError} />

            <div className="flex flex-col gap-1.5">
              <label className={labelCls} htmlFor="su-name">Full Name</label>
              <input id="su-name" type="text" value={suName}
                onChange={e => setSuName(e.target.value)}
                placeholder="Your name" required autoComplete="name"
                className={inputCls} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls} htmlFor="su-email">Email Address</label>
              <input id="su-email" type="email" value={suEmail}
                onChange={e => setSuEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className={inputCls} />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className={labelCls} htmlFor="su-password">Password</label>
                <span className="text-[11px] text-faint">min. 8 characters</span>
              </div>
              <input id="su-password" type="password" value={suPassword}
                onChange={e => setSuPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="new-password"
                className={inputCls} />
            </div>

            <button type="submit" disabled={suLoading}
              className="mt-1 bg-primary text-white text-sm font-semibold rounded-lg py-2.5 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
              {suLoading ? 'Creating account...' : 'SIGN UP'}
            </button>
          </form>

          {/* Mobile toggle */}
          <p className="text-[13px] text-muted text-center mt-6 sm:hidden">
            Already have an account?{' '}
            <button onClick={() => switchTo('signin')}
              className="text-primary hover:underline font-medium cursor-pointer bg-transparent border-none p-0">
              Sign in
            </button>
          </p>
        </div>

        {/* ── Sliding overlay (blue brand panel) ───────────────────────── */}
        <div className="auth-overlay-wrapper">
          <div className="auth-overlay">

            {/* Left panel — "Welcome Back!" shown when sign-up is active */}
            <div className="auth-overlay-panel auth-overlay-left">
              {/* Logo — pinned to top */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                </div>
                <span className="text-white text-[15px] font-semibold tracking-tight">Knowbase</span>
              </div>

              {/* Centered content */}
              <h2 className="text-white text-[26px] font-bold leading-snug mb-3">Welcome Back!</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-8">
                Already have an account?<br />Sign in to access your knowledge base.
              </p>
              <button onClick={() => switchTo('signin')}
                className="border-2 border-white text-white text-sm font-semibold px-8 py-2.5 rounded-full hover:bg-white/15 active:scale-[0.98] transition-all cursor-pointer bg-transparent">
                SIGN IN
              </button>

              {/* Footer — pinned to bottom */}
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs whitespace-nowrap">
                Personal knowledge search engine
              </p>
            </div>

            {/* Right panel — "Hey There!" shown when sign-in is active */}
            <div className="auth-overlay-panel auth-overlay-right">
              {/* Logo — pinned to top */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                </div>
                <span className="text-white text-[15px] font-semibold tracking-tight">Knowbase</span>
              </div>

              {/* Centered content */}
              <h2 className="text-white text-[26px] font-bold leading-snug mb-3">Hey There!</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-8">
                New here? Create an account and<br />start your journey with us.
              </p>
              <button onClick={() => switchTo('signup')}
                className="border-2 border-white text-white text-sm font-semibold px-8 py-2.5 rounded-full hover:bg-white/15 active:scale-[0.98] transition-all cursor-pointer bg-transparent">
                SIGN UP
              </button>

              {/* Footer — pinned to bottom */}
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs whitespace-nowrap">
                Personal knowledge search engine
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

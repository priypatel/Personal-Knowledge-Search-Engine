import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV, CLIENT_URL } from '../config/env.js';
import { sendPasswordResetEmail } from '../services/email.service.js';

// ── Cookie helpers ─────────────────────────────────────────────────────────────

const COOKIE_BASE = {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
};

const ACCESS_COOKIE_OPTS  = { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 };          // 15 min
const REFRESH_COOKIE_OPTS = { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 days

function signAccessToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueTokens(res, userId) {
  const accessToken  = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  const tokenHash    = hashToken(refreshToken);
  const expiresAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTS);
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
export async function register(req, res) {
  const { email, displayName, password } = req.body;

  if (!email || !displayName || !password) {
    return res.status(400).json({ error: 'email, displayName, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO users (email, display_name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name`,
    [email.toLowerCase(), displayName.trim(), passwordHash]
  );

  const user = result.rows[0];
  await issueTokens(res, user.id);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
  });
}

/**
 * POST /api/auth/login
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user   = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  await issueTokens(res, user.id);

  return res.status(200).json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
  });
}

/**
 * POST /api/auth/refresh
 * Uses refresh_token cookie to issue a new access_token + rotated refresh_token.
 */
export async function refresh(req, res) {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const tokenHash = hashToken(token);
  const stored = await query(
    `SELECT id FROM refresh_tokens
     WHERE token_hash = $1 AND user_id = $2 AND expires_at > NOW()`,
    [tokenHash, payload.userId]
  );

  if (!stored.rows.length) {
    return res.status(401).json({ error: 'Refresh token revoked or expired' });
  }

  // Rotate — delete old, issue new pair
  await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  await issueTokens(res, payload.userId);

  const user = await query(
    'SELECT id, email, display_name FROM users WHERE id = $1',
    [payload.userId]
  );

  return res.status(200).json({
    id: user.rows[0].id,
    email: user.rows[0].email,
    displayName: user.rows[0].display_name,
  });
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  const token = req.cookies?.refresh_token;
  if (token) {
    const tokenHash = hashToken(token);
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]).catch(() => {});
  }
  res.clearCookie('access_token',  COOKIE_BASE);
  res.clearCookie('refresh_token', COOKIE_BASE);
  return res.status(200).json({ message: 'Logged out' });
}

/**
 * GET /api/auth/me
 */
export function me(req, res) {
  return res.status(200).json(req.user);
}

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const result = await query(
    'SELECT id, email, display_name FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  // Always 200 — never reveal whether email exists (prevents enumeration)
  if (!result.rows.length) {
    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  }

  const user      = result.rows[0];
  const token     = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, tokenHash, expiresAt]
  );

  const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, user.display_name, resetLink);

  return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
}

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
export async function resetPassword(req, res) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'token and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const tokenHash = hashToken(token);
  const result = await query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash]
  );

  if (!result.rows.length) {
    return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
  }

  const { user_id } = result.rows[0];
  const passwordHash = await bcrypt.hash(password, 12);

  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user_id]);
  await query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);
  // Invalidate all sessions after password change
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [user_id]);

  return res.status(200).json({ message: 'Password reset successfully. Please sign in.' });
}

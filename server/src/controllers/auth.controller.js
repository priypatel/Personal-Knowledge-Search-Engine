import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { JWT_SECRET, NODE_ENV } from '../config/env.js';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  // 'none' required for cross-domain (Vercel → Render in production)
  sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * POST /api/auth/register
 * Body: { email, displayName, password }
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
  res.cookie('token', signToken(user.id), COOKIE_OPTS);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
  });
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.cookie('token', signToken(user.id), COOKIE_OPTS);

  return res.status(200).json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
  });
}

/**
 * POST /api/auth/logout
 */
export function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.status(200).json({ message: 'Logged out' });
}

/**
 * GET /api/auth/me  — returns current user from cookie
 */
export function me(req, res) {
  return res.status(200).json(req.user);
}

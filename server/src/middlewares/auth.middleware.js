import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';

async function lookupUser(userId) {
  const result = await query(
    'SELECT id, email, display_name FROM users WHERE id = $1',
    [userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { id: row.id, email: row.email, displayName: row.display_name };
}

/**
 * Verifies the short-lived access_token cookie (15 min).
 * Returns 401 if missing or expired — client should call POST /api/auth/refresh.
 */
export async function requireAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await lookupUser(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
}

/**
 * Like requireAuth but never blocks — sets req.user = null if no valid token.
 */
export async function optionalAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = await lookupUser(payload.userId);
  } catch {
    req.user = null;
  }
  next();
}

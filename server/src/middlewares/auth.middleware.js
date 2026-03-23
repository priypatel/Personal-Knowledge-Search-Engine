import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';

/**
 * Verifies the JWT stored in httpOnly cookie.
 * Attaches req.user = { id, email, displayName } on success.
 */
export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await query(
      'SELECT id, email, display_name FROM users WHERE id = $1',
      [payload.userId]
    );
    if (!result.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      displayName: result.rows[0].display_name,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * Like requireAuth but never blocks — sets req.user to null if no valid session.
 * Use for routes that guests can access with limited functionality.
 */
export async function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await query(
      'SELECT id, email, display_name FROM users WHERE id = $1',
      [payload.userId]
    );
    req.user = result.rows[0]
      ? { id: result.rows[0].id, email: result.rows[0].email, displayName: result.rows[0].display_name }
      : null;
  } catch {
    req.user = null;
  }
  next();
}

import jwt from 'jsonwebtoken';
import { getUserById } from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-before-production';

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.*)$/i);
    if (!m) return res.status(401).json({ error: 'Missing token' });
    const token = m[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.id);
    if (!user) return res.status(401).json({ error: 'Invalid user' });
    req.user = user;
    next();
  } catch (e) {
    console.error('requireAuth failure:', e && e.message ? e.message : e);
    const msg = (process.env.NODE_ENV !== 'production') ? (e && e.message ? e.message : 'Unauthorized') : 'Unauthorized';
    res.status(401).json({ error: msg });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.*)$/i);
    if (!m) return next();
    const token = m[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.id);
    if (!user) return next();
    req.user = user;
    return next();
  } catch (e) {
    // If token invalid, ignore and continue as anonymous
    return next();
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

export function requireRoles(...roles) {
  const allowed = new Set((roles || []).map((r) => String(r || '').toLowerCase()).filter(Boolean));
  return function requireRoleMiddleware(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const role = String(req.user.role || '').toLowerCase();
    if (!allowed.has(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export const requireAdminOrCashier = requireRoles('admin', 'cashier');

export function requireCustomer(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Forbidden' });
  next();
}

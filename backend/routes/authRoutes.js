import express from "express";
import jwt from "jsonwebtoken";
import {
  authenticateUser,
  createManagedUser,
  listManagedUsers,
  registerUser,
  getUserById,
  requestPasswordReset,
  resetPasswordWithCode
} from "../models/userModel.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { isValidLoginEmail, normalizeEmail, normalizeRole } from "../utils/inputValidation.js";
import {
  clearLoginAttempts,
  getLoginThrottleKey,
  getLoginThrottleState,
  getPasswordResetTtlMinutes,
  isPrivilegedRole,
  registerFailedLoginAttempt,
  validateRoleSecurityCode
} from "../utils/authSecurity.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-before-production';

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const selectedRole = normalizeRole(req.body?.role);
    const securityCode = String(req.body?.securityCode || '').trim();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!isValidLoginEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const throttleKey = getLoginThrottleKey(email, ipAddress);
    const throttleState = getLoginThrottleState(throttleKey);
    if (throttleState.locked) {
      const retryMinutes = Math.max(1, Math.ceil(throttleState.remainingMs / 60000));
      return res.status(429).json({ error: `Too many failed login attempts. Try again in ${retryMinutes} minute(s).` });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      registerFailedLoginAttempt(throttleKey);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (selectedRole && user.role !== selectedRole) {
      registerFailedLoginAttempt(throttleKey);
      return res.status(403).json({ error: `This account is not registered as ${selectedRole}` });
    }

    if (isPrivilegedRole(user.role)) {
      if (!securityCode) {
        registerFailedLoginAttempt(throttleKey);
        return res.status(400).json({ error: 'Security code is required for admin and cashier login' });
      }
      if (!validateRoleSecurityCode(user.role, securityCode)) {
        registerFailedLoginAttempt(throttleKey);
        return res.status(401).json({ error: 'Invalid security code' });
      }
    }

    clearLoginAttempts(throttleKey);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role, user });
  } catch (e) {
    // return 400 for known validation errors (like duplicate user), otherwise 500
    if (e && e.message && e.message.toLowerCase().includes('user already exists')) {
      return res.status(400).json({ error: e.message });
    }
    res.status(500).json({ error: e.message });
  }
}); 

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await registerUser(name, email, password, role);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role, user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/forgot-password/request', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const result = await requestPasswordReset(email);
    res.json({
      ...result,
      ttlMinutes: getPasswordResetTtlMinutes(),
    });
  } catch (e) {
    res.status(e.statusCode || 400).json({ error: e.message || 'Unable to start password reset' });
  }
});

router.post('/forgot-password/reset', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || '');
    const newPassword = String(req.body?.newPassword || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!confirmPassword) {
      return res.status(400).json({ error: 'Please confirm the new password' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    await resetPasswordWithCode(email, code, newPassword);
    res.json({ message: 'Password reset successful. You can now sign in.' });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Unable to reset password' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.*)$/i);
    if (!m) return res.status(401).json({ error: 'Missing token' });
    const token = m[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.id);
    res.json({ user });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/users/staff', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await listManagedUsers();
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Unable to load staff accounts' });
  }
});

router.post('/users/staff', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const user = await createManagedUser(name, email, password, role);
    res.status(201).json({
      message: 'Staff account created successfully.',
      user,
    });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Unable to create staff account' });
  }
});

export default router;

import crypto from 'crypto';

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_LOCK_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

const loginAttempts = new Map();

const STAFF_ROLE_CODES = {
  admin: process.env.ADMIN_SECURITY_CODE || 'CP-ADMIN-2468',
  cashier: process.env.CASHIER_SECURITY_CODE || 'CP-CASH-1357',
};

export function isPrivilegedRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'admin' || normalized === 'cashier';
}

export function getRoleSecurityCode(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return STAFF_ROLE_CODES[normalized] || '';
}

export function validateRoleSecurityCode(role, providedCode) {
  const expected = getRoleSecurityCode(role);
  if (!expected) return true;

  const actualBuffer = Buffer.from(String(providedCode || '').trim());
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function getLoginThrottleKey(email, ipAddress) {
  return `${String(email || '').trim().toLowerCase()}|${String(ipAddress || 'unknown').trim()}`;
}

export function getLoginThrottleState(key) {
  const now = Date.now();
  const state = loginAttempts.get(key);
  if (!state) return { locked: false, remainingMs: 0, attempts: 0 };

  if (state.lockedUntil && state.lockedUntil > now) {
    return {
      locked: true,
      remainingMs: state.lockedUntil - now,
      attempts: state.attempts || 0,
    };
  }

  if (now - state.windowStartedAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return { locked: false, remainingMs: 0, attempts: 0 };
  }

  if (state.lockedUntil && state.lockedUntil <= now) {
    loginAttempts.delete(key);
    return { locked: false, remainingMs: 0, attempts: 0 };
  }

  return { locked: false, remainingMs: 0, attempts: state.attempts || 0 };
}

export function registerFailedLoginAttempt(key) {
  const now = Date.now();
  const existing = loginAttempts.get(key);

  if (!existing || now - existing.windowStartedAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, {
      attempts: 1,
      windowStartedAt: now,
      lockedUntil: null,
    });
    return getLoginThrottleState(key);
  }

  const attempts = (existing.attempts || 0) + 1;
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_LOCK_MS : null;

  loginAttempts.set(key, {
    attempts,
    windowStartedAt: existing.windowStartedAt,
    lockedUntil,
  });

  return getLoginThrottleState(key);
}

export function clearLoginAttempts(key) {
  loginAttempts.delete(key);
}

export function generatePasswordResetCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

export function hashPasswordResetCode(code) {
  return crypto.createHash('sha256').update(String(code || '').trim()).digest('hex');
}

export function getPasswordResetExpiryIso() {
  return new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();
}

export function getPasswordResetTtlMinutes() {
  return Math.round(PASSWORD_RESET_TTL_MS / 60000);
}

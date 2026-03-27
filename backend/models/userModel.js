import { getDB } from "../config/database.js";
import bcrypt from "bcrypt";
import { isValidStandardEmail, normalizeEmail, normalizeRole } from "../utils/inputValidation.js";
import {
  generatePasswordResetCode,
  getPasswordResetTtlMinutes,
  getPasswordResetExpiryIso,
  hashPasswordResetCode,
} from "../utils/authSecurity.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

const SALT_ROUNDS = 12;
const MANAGED_STAFF_ROLES = new Set(['admin', 'cashier']);

async function createUserRecord({ name, email, password, role }) {
  const db = getDB();
  const normalizedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = normalizeRole(role);

  if (!normalizedName) throw new Error('Name is required');
  if (!isValidStandardEmail(normalizedEmail)) throw new Error('Please enter a valid email address');
  if (!password || String(password).length < 8) throw new Error('Password must be at least 8 characters');
  if (!normalizedRole) throw new Error('Invalid role');

  const exists = await db.get(`SELECT id FROM users WHERE email = ?`, normalizedEmail);
  if (exists) throw new Error('User already exists');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const res = await db.run(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    normalizedName,
    normalizedEmail,
    hashed,
    normalizedRole
  );

  const id = res.lastID || (res.stmt && res.stmt.lastID) || null;
  return { id, name: normalizedName, email: normalizedEmail, role: normalizedRole };
}

export async function authenticateUser(email, password) {
  const db = getDB();
  const normalizedEmail = normalizeEmail(email);
  const user = await db.get(`SELECT * FROM users WHERE email = ?`, normalizedEmail);
  if (!user) return null;
  // If password is stored unhashed (legacy), accept and hash it now
  const isHashed = user.password && user.password.startsWith('$2b$');
  if (!isHashed) {
    if (password === user.password) {
      // rehash and update
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      await db.run(`UPDATE users SET password = ? WHERE id = ?`, hashed, user.id);
      // update the in-memory user record so subsequent compare uses the hashed value
      user.password = hashed;
    } else {
      return null;
    }
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function getUserById(id) {
  const db = getDB();
  const user = await db.get(`SELECT id, name, email, role FROM users WHERE id = ?`, id);
  return user || null;
}

export async function getAllUsers() {
  const db = getDB();
  return await db.all(`SELECT id, name, email, role FROM users`);
}

export async function registerUser(name, email, password, role = "customer") {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole !== 'customer') {
    throw new Error('Only customer self-registration is allowed. Admin and cashier accounts must be issued internally.');
  }

  return createUserRecord({ name, email, password, role: normalizedRole });
}

export async function createManagedUser(name, email, password, role) {
  const normalizedRole = normalizeRole(role);

  if (!MANAGED_STAFF_ROLES.has(normalizedRole)) {
    throw new Error('Staff role must be either admin or cashier.');
  }

  return createUserRecord({ name, email, password, role: normalizedRole });
}

export async function listManagedUsers() {
  const db = getDB();
  return db.all(
    `SELECT id, name, email, role
     FROM users
     WHERE role IN ('admin', 'cashier')
     ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END, name COLLATE NOCASE ASC, email COLLATE NOCASE ASC`
  );
}

export async function requestPasswordReset(email) {
  const db = getDB();
  const normalizedEmail = normalizeEmail(email);

  if (!isValidStandardEmail(normalizedEmail)) {
    throw new Error('Please enter a valid email address');
  }

  const genericMessage = 'If the account exists, a password reset code has been prepared.';
  const user = await db.get(`SELECT id, name, email FROM users WHERE email = ?`, normalizedEmail);
  if (!user) {
    return { message: genericMessage };
  }

  const resetCode = generatePasswordResetCode();
  const expiresAt = getPasswordResetExpiryIso();
  const requestedAt = new Date().toISOString();
  const ttlMinutes = getPasswordResetTtlMinutes();

  await db.run(
    `UPDATE users
     SET password_reset_code_hash = ?, password_reset_expires_at = ?, password_reset_requested_at = ?
     WHERE id = ?`,
    hashPasswordResetCode(resetCode),
    expiresAt,
    requestedAt,
    user.id
  );

  const emailResult = await sendPasswordResetEmail({
    to: user.email,
    recipientName: user.name,
    code: resetCode,
    ttlMinutes
  });

  return {
    message: emailResult.mode === 'smtp'
      ? 'If the account exists, a password reset code has been sent to the registered email.'
      : genericMessage,
    ...(emailResult.mode === 'preview' ? { demoCode: resetCode } : {}),
  };
}

export async function resetPasswordWithCode(email, code, newPassword) {
  const db = getDB();
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code || '').trim();

  if (!isValidStandardEmail(normalizedEmail)) {
    throw new Error('Please enter a valid email address');
  }
  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new Error('Reset code must be 6 digits');
  }
  if (!newPassword || String(newPassword).length < 8) {
    throw new Error('New password must be at least 8 characters');
  }

  const user = await db.get(
    `SELECT id, password_reset_code_hash, password_reset_expires_at
     FROM users
     WHERE email = ?`,
    normalizedEmail
  );

  if (!user?.password_reset_code_hash || !user?.password_reset_expires_at) {
    throw new Error('Invalid or expired reset code');
  }

  if (new Date(user.password_reset_expires_at).getTime() < Date.now()) {
    throw new Error('Invalid or expired reset code');
  }

  const incomingHash = hashPasswordResetCode(normalizedCode);
  if (incomingHash !== user.password_reset_code_hash) {
    throw new Error('Invalid or expired reset code');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.run(
    `UPDATE users
     SET password = ?, password_reset_code_hash = NULL, password_reset_expires_at = NULL, password_reset_requested_at = NULL
     WHERE id = ?`,
    hashedPassword,
    user.id
  );

  return { success: true };
}

import { getDB } from "../config/database.js";
import bcrypt from "bcrypt";
import { isValidStandardEmail, normalizeEmail, normalizeRole } from "../utils/inputValidation.js";

const SALT_ROUNDS = 10;

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
  const db = getDB();
  const normalizedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = normalizeRole(role);
  if (!normalizedName) throw new Error('Name is required');
  if (!isValidStandardEmail(normalizedEmail)) throw new Error('Please enter a valid email address');
  if (!password || String(password).length < 6) throw new Error('Password must be at least 6 characters');
  if (!normalizedRole) throw new Error('Invalid role');

  const exists = await db.get(`SELECT id FROM users WHERE email = ?`, normalizedEmail);
  if (exists) throw new Error('User already exists');
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const res = await db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, normalizedName, normalizedEmail, hashed, normalizedRole);
  const id = res.lastID || (res.stmt && res.stmt.lastID) || null;
  return { id, name: normalizedName, email: normalizedEmail, role: normalizedRole };
}

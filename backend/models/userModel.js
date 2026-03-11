import { getDB } from "../config/database.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function authenticateUser(email, password) {
  const db = getDB();
  const user = await db.get(`SELECT * FROM users WHERE email = ?`, email);
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
  const exists = await db.get(`SELECT id FROM users WHERE email = ?`, email);
  if (exists) throw new Error('User already exists');
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const res = await db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, name, email, hashed, role);
  const id = res.lastID || (res.stmt && res.stmt.lastID) || null;
  return { id, name, email, role };
}

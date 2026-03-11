import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

let db;

export async function initDB() {
  // resolve DB path relative to this config file so server can be started from any cwd
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dbPath = path.join(__dirname, '..', 'database.sqlite');

  // create a timestamped backup of the DB file (if present) to avoid accidental data loss
  try {
    if (fs.existsSync(dbPath)) {
      const backupsDir = path.join(__dirname, '..', 'backups');
      if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
      const now = new Date();
      const stamp = now.toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupsDir, `database-${stamp}.sqlite`);
      fs.copyFileSync(dbPath, backupPath);
      console.log('Database backup created at', backupPath);
    }
  } catch (e) {
    console.error('Failed to create DB backup:', e);
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category TEXT,
      price REAL,
      stock INTEGER,
      barcode TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL,
      paymentMethod TEXT,
      createdAt TEXT,
      user_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT
    );
  `);

  // ensure legacy databases get the `image` column
  try {
    const info = await db.all("PRAGMA table_info(products)");
    const hasImage = info.some(c => c.name === 'image');
    if (!hasImage) {
      await db.run(`ALTER TABLE products ADD COLUMN image TEXT`);
    }
    // ensure sales.user_id exists
    const saleInfo = await db.all("PRAGMA table_info(sales)");
    const hasUserId = saleInfo.some(c => c.name === 'user_id');
    if (!hasUserId) {
      await db.run(`ALTER TABLE sales ADD COLUMN user_id INTEGER`);
    }

    // ensure users table exists (created above) and seed default users if empty
    const ucount = await db.get(`SELECT COUNT(*) as c FROM users`);
    if (!ucount || ucount.c === 0) {
      // minimal default users; passwords should be hashed by userModel.registerUser during startup
      await db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 'Admin', 'admin@local', 'admin123', 'admin');
      await db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 'Customer', 'customer@local', 'cust123', 'customer');
    }
  } catch (err) {
    console.error('Error ensuring image column:', err);
  }

  return db;
}

export function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call initDB() first.");
  }
  return db;
}

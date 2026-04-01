import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { reconcileLegacyAccountEmails } from '../utils/accountSeeding.js';

let db;

function parseBooleanEnv(value, defaultValue = false) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function resolveDatabasePath() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const configuredPath = String(process.env.DATABASE_PATH || '').trim();

  if (!configuredPath) {
    return path.join(__dirname, '..', 'database.sqlite');
  }

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(path.join(__dirname, '..'), configuredPath);
}

function ensureDatabaseDirectoryExists(dbDir, dbPath, isProduction) {
  if (fs.existsSync(dbDir)) {
    return;
  }

  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (error) {
    if (error && error.code === 'EACCES') {
      const message = isProduction
        ? `Database directory is not writable: ${dbDir}. If you are deploying on Render, attach a persistent disk and set DATABASE_PATH to a file inside that mount path, or use a writable relative path like ./data/database.sqlite for an ephemeral demo deployment.`
        : `Database directory is not writable: ${dbDir}. Update DATABASE_PATH to a writable location.`;

      const wrappedError = new Error(message);
      wrappedError.cause = error;
      throw wrappedError;
    }

    throw error;
  }
}

export async function initDB() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dbPath = resolveDatabasePath();
  const dbDir = path.dirname(dbPath);
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldBackupDb = parseBooleanEnv(process.env.ENABLE_DB_BACKUPS, !isProduction);

  ensureDatabaseDirectoryExists(dbDir, dbPath, isProduction);

  if (isProduction && !String(process.env.DATABASE_PATH || '').trim()) {
    console.warn(
      'DATABASE_PATH is not set in production. SQLite will use a local ephemeral file unless your host mounts persistent storage.'
    );
  }

  // create a timestamped backup of the DB file (if present) to avoid accidental data loss
  try {
    if (shouldBackupDb && fs.existsSync(dbPath)) {
      const backupsDir = path.join(__dirname, '..', 'backups');
      if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
      const now = new Date();
      const stamp = now.toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupsDir, `database-${stamp}.sqlite`);
      fs.copyFileSync(dbPath, backupPath);
      console.log('Database backup created at', backupPath);
    } else if (!shouldBackupDb) {
      console.log('Database backup skipped because ENABLE_DB_BACKUPS is disabled.');
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
      subtotal REAL,
      paymentMethod TEXT,
      receipt_number TEXT,
      createdAt TEXT,
      user_id INTEGER,
      discount_type TEXT,
      discount_value REAL,
      discount_amount REAL,
      tax_rate REAL,
      tax_amount REAL,
      amount_tendered REAL,
      change_amount REAL,
      status TEXT,
      sale_channel TEXT,
      voidedAt TEXT,
      fulfillment_type TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      delivery_address TEXT,
      payment_reference TEXT,
      payment_last4 TEXT
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      product_name TEXT,
      quantity INTEGER,
      price REAL,
      line_total REAL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      password_reset_code_hash TEXT,
      password_reset_expires_at TEXT,
      password_reset_requested_at TEXT
    );
  `);

  // ensure legacy databases get the `image` column
  try {
    async function ensureColumn(tableName, columnName, definition) {
      const columns = await db.all(`PRAGMA table_info(${tableName})`);
      const hasColumn = columns.some((c) => c.name === columnName);
      if (!hasColumn) {
        await db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
      }
    }

    const info = await db.all("PRAGMA table_info(products)");
    const hasImage = info.some(c => c.name === 'image');
    if (!hasImage) {
      await db.run(`ALTER TABLE products ADD COLUMN image TEXT`);
    }
    await ensureColumn('sales', 'user_id', 'INTEGER');
    await ensureColumn('sales', 'subtotal', 'REAL DEFAULT 0');
    await ensureColumn('sales', 'receipt_number', 'TEXT');
    await ensureColumn('sales', 'discount_type', 'TEXT');
    await ensureColumn('sales', 'discount_value', 'REAL DEFAULT 0');
    await ensureColumn('sales', 'discount_amount', 'REAL DEFAULT 0');
    await ensureColumn('sales', 'tax_rate', 'REAL DEFAULT 0');
    await ensureColumn('sales', 'tax_amount', 'REAL DEFAULT 0');
    await ensureColumn('sales', 'amount_tendered', 'REAL DEFAULT 0');
    await ensureColumn('sales', 'change_amount', 'REAL DEFAULT 0');
    await ensureColumn('sales', 'status', 'TEXT DEFAULT \'completed\'');
    await ensureColumn('sales', 'sale_channel', 'TEXT DEFAULT \'pos\'');
    await ensureColumn('sales', 'voidedAt', 'TEXT');
    await ensureColumn('sales', 'fulfillment_type', 'TEXT DEFAULT \'in-store\'');
    await ensureColumn('sales', 'customer_name', 'TEXT');
    await ensureColumn('sales', 'customer_phone', 'TEXT');
    await ensureColumn('sales', 'customer_email', 'TEXT');
    await ensureColumn('sales', 'delivery_address', 'TEXT');
    await ensureColumn('sales', 'payment_reference', 'TEXT');
    await ensureColumn('sales', 'payment_last4', 'TEXT');

    await ensureColumn('sale_items', 'product_name', 'TEXT');
    await ensureColumn('sale_items', 'line_total', 'REAL DEFAULT 0');
    await ensureColumn('users', 'password_reset_code_hash', 'TEXT');
    await ensureColumn('users', 'password_reset_expires_at', 'TEXT');
    await ensureColumn('users', 'password_reset_requested_at', 'TEXT');

    await db.run(`UPDATE sales SET subtotal = COALESCE(subtotal, total, 0) WHERE subtotal IS NULL`);
    await db.run(`UPDATE sales SET discount_value = COALESCE(discount_value, 0) WHERE discount_value IS NULL`);
    await db.run(`UPDATE sales SET discount_amount = COALESCE(discount_amount, 0) WHERE discount_amount IS NULL`);
    await db.run(`UPDATE sales SET tax_rate = COALESCE(tax_rate, 0) WHERE tax_rate IS NULL`);
    await db.run(`UPDATE sales SET tax_amount = COALESCE(tax_amount, 0) WHERE tax_amount IS NULL`);
    await db.run(`UPDATE sales SET amount_tendered = COALESCE(amount_tendered, total, 0) WHERE amount_tendered IS NULL`);
    await db.run(`UPDATE sales SET change_amount = COALESCE(change_amount, 0) WHERE change_amount IS NULL`);
    await db.run(`UPDATE sales SET status = 'completed' WHERE status IS NULL OR TRIM(status) = ''`);
    await db.run(`UPDATE sales SET sale_channel = CASE WHEN sale_channel IS NULL OR TRIM(sale_channel) = '' THEN CASE WHEN LOWER(COALESCE(paymentMethod, '')) = 'online' THEN 'online' ELSE 'pos' END ELSE sale_channel END`);
    await db.run(`UPDATE sales SET fulfillment_type = CASE WHEN fulfillment_type IS NULL OR TRIM(fulfillment_type) = '' THEN CASE WHEN COALESCE(sale_channel, 'pos') = 'online' THEN 'delivery' ELSE 'in-store' END ELSE fulfillment_type END`);
    await db.run(`UPDATE sales SET customer_name = COALESCE(customer_name, '') WHERE customer_name IS NULL`);
    await db.run(`UPDATE sales SET customer_phone = COALESCE(customer_phone, '') WHERE customer_phone IS NULL`);
    await db.run(`UPDATE sales SET customer_email = COALESCE(customer_email, '') WHERE customer_email IS NULL`);
    await db.run(`UPDATE sales SET delivery_address = COALESCE(delivery_address, '') WHERE delivery_address IS NULL`);
    await db.run(`UPDATE sales SET payment_reference = COALESCE(payment_reference, '') WHERE payment_reference IS NULL`);
    await db.run(`UPDATE sales SET payment_last4 = COALESCE(payment_last4, '') WHERE payment_last4 IS NULL`);
    await db.run(`UPDATE sale_items SET product_name = COALESCE(product_name, '') WHERE product_name IS NULL`);
    await db.run(`UPDATE sale_items SET line_total = ROUND(COALESCE(quantity, 0) * COALESCE(price, 0), 2) WHERE line_total IS NULL OR line_total = 0`);

    await reconcileLegacyAccountEmails(db);

    // Seed default users only in development unless explicitly enabled.
    const ucount = await db.get(`SELECT COUNT(*) as c FROM users`);
    if (!ucount || ucount.c === 0) {
      const shouldSeedDefaultUsers = parseBooleanEnv(
        process.env.SEED_DEFAULT_USERS,
        !isProduction
      );

      if (shouldSeedDefaultUsers) {
        // Minimal default users for local development only; passwords are upgraded to bcrypt on first successful login.
        await db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 'Admin', 'admin@charliepc.ph', 'admin123', 'admin');
        await db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 'Cashier', 'cashier@charliepc.ph', 'cashier123', 'cashier');
        await db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 'Customer', 'customer@charliepc.ph', 'cust123', 'customer');
      } else {
        console.warn('Users table is empty and SEED_DEFAULT_USERS is disabled. Create the first admin account manually before production use.');
      }
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

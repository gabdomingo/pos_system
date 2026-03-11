import bcrypt from 'bcrypt';
import { initDB, getDB } from '../config/database.js';

const SALT_ROUNDS = 10;

const ACCOUNTS = [
  { name: 'Admin', email: 'admin@local', password: 'admin123', role: 'admin' },
  { name: 'Cashier', email: 'cashier@local', password: 'cashier123', role: 'cashier' },
  { name: 'Customer', email: 'customer@local', password: 'cust123', role: 'customer' }
];

async function upsertAccount(db, account) {
  const existing = await db.get('SELECT id FROM users WHERE email = ?', account.email);
  const hashedPassword = await bcrypt.hash(account.password, SALT_ROUNDS);

  if (existing) {
    await db.run(
      'UPDATE users SET name = ?, role = ?, password = ? WHERE id = ?',
      account.name,
      account.role,
      hashedPassword,
      existing.id
    );
    return `updated: ${account.email}`;
  }

  await db.run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    account.name,
    account.email,
    hashedPassword,
    account.role
  );
  return `created: ${account.email}`;
}

(async function seedAccounts() {
  try {
    await initDB();
    const db = getDB();

    for (const account of ACCOUNTS) {
      const result = await upsertAccount(db, account);
      console.log(result);
    }

    console.log('Account seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Account seeding failed:', error?.message || error);
    process.exit(1);
  }
})();

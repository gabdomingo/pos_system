import { initDB, getDB } from '../config/database.js';
import { reconcileLegacyAccountEmails, upsertAccounts } from '../utils/accountSeeding.js';

const ACCOUNTS = [
  { name: 'Admin', email: 'admin@charliepc.ph', password: 'admin123', role: 'admin' },
  { name: 'Cashier', email: 'cashier@charliepc.ph', password: 'cashier123', role: 'cashier' },
  { name: 'Claire', email: 'claire@charliepc.ph', password: 'claire123', role: 'cashier' },
  { name: 'Customer', email: 'customer@charliepc.ph', password: 'cust123', role: 'customer' }
];

(async function seedAccounts() {
  try {
    await initDB();
    const db = getDB();

    const migrations = await reconcileLegacyAccountEmails(db);
    migrations.forEach((entry) => console.log(entry));

    const results = await upsertAccounts(db, ACCOUNTS);
    for (const result of results) {
      console.log(result);
    }

    console.log('Account seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Account seeding failed:', error?.message || error);
    process.exit(1);
  }
})();

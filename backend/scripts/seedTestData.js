import { initDB, getDB } from '../config/database.js';
import { cleanupLegacyDemoProducts, cleanupProductsWithoutPhotos, seedDemoProducts } from '../data/demoProducts.js';
import { reconcileLegacyAccountEmails, upsertAccounts } from '../utils/accountSeeding.js';

(async function seed() {
  try {
    await initDB();
    const db = getDB();
    const seededUsers = [
      { name: 'Admin', email: 'admin@charliepc.ph', password: 'admin123', role: 'admin' },
      { name: 'Cashier', email: 'cashier@charliepc.ph', password: 'cashier123', role: 'cashier' },
      { name: 'Claire', email: 'claire@charliepc.ph', password: 'claire123', role: 'cashier' },
      { name: 'Customer', email: 'customer@charliepc.ph', password: 'cust123', role: 'customer' },
      { name: 'Gabriel', email: 'gabriel@charliepc.ph', password: 'gabriel123', role: 'customer' },
      { name: 'Carl', email: 'carl@charliepc.ph', password: 'carl12345', role: 'customer' }
    ];

    const migrations = await reconcileLegacyAccountEmails(db);
    migrations.forEach((entry) => console.log(entry));

    const accountResults = await upsertAccounts(db, seededUsers);
    for (const result of accountResults) {
      console.log(result);
    }

    const removedLegacy = await cleanupLegacyDemoProducts(db);
    const removedWithoutPhotos = await cleanupProductsWithoutPhotos(db);
    const result = await seedDemoProducts(db);
    console.log(
      `Products ready: ${result.inserted} inserted, ${result.updated} updated, ${result.removedStale} stale products removed, ${removedLegacy} old placeholders removed, ${removedWithoutPhotos} products without photos removed.`
    );

    console.log('Seeding complete.');
    process.exit(0);
  } catch (e) {
    console.error('Seeding error:', e);
    process.exit(1);
  }
})();

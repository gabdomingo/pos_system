import { initDB, getDB } from '../config/database.js';
import {
  cleanupLegacyDemoProducts,
  cleanupProductsWithoutPhotos,
  seedDemoProducts
} from '../data/demoProducts.js';

(async function seedProductsOnly() {
  try {
    await initDB();
    const db = getDB();

    const removedLegacy = await cleanupLegacyDemoProducts(db);
    const removedWithoutPhotos = await cleanupProductsWithoutPhotos(db);
    const result = await seedDemoProducts(db);
    const categoryCounts = await db.all(
      `SELECT category, COUNT(*) AS count
       FROM products
       WHERE image IS NOT NULL
         AND TRIM(image) <> ''
       GROUP BY category
       ORDER BY category`
    );

    console.log(
      `Products ready: ${result.inserted} inserted, ${result.updated} updated, ${result.removedStale} stale removed, ${removedLegacy} legacy removed, ${removedWithoutPhotos} without-photo removed.`
    );
    console.log('Category counts:');
    categoryCounts.forEach((row) => {
      console.log(`- ${row.category}: ${row.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Product-only seeding failed:', error?.message || error);
    process.exit(1);
  }
})();

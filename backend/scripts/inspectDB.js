import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

(async () => {
  try {
    const dbPath = path.resolve('./backend/database.sqlite');
    console.log('Opening DB at', dbPath);
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    const products = await db.all('SELECT * FROM products ORDER BY id DESC');
    const sales = await db.all('SELECT * FROM sales ORDER BY id DESC');
    const saleItems = await db.all('SELECT * FROM sale_items ORDER BY id DESC');

    console.log('Products count:', products.length);
    console.log('Sales count:', sales.length);
    console.log('Sale items count:', saleItems.length);

    if (products.length > 0) console.log('Recent products:', JSON.stringify(products.slice(0,5), null, 2));
    if (sales.length > 0) console.log('Recent sales:', JSON.stringify(sales.slice(0,5), null, 2));
    if (saleItems.length > 0) console.log('Recent sale_items:', JSON.stringify(saleItems.slice(0,5), null, 2));

    await db.close();
  } catch (e) {
    console.error('inspectDB error:', e);
    process.exit(1);
  }
})();

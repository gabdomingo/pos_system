import { initDB, getDB } from '../config/database.js';
import { registerUser } from '../models/userModel.js';

(async function seed() {
  try {
    await initDB();
    const db = getDB();

    // create a cashier user (if not exists) using registerUser so password is hashed
    try {
      await registerUser('Cashier', 'cashier@local', 'cashier123', 'cashier');
      console.log('Created cashier@local');
    } catch (e) {
      console.log('Cashier user exists or failed to create:', e.message || e);
    }

    const products = [
      { name: 'Intel Core i5-11400', category: 'Processor', price: 8500, stock: 10 },
      { name: 'AMD Ryzen 5 5600X', category: 'Processor', price: 10500, stock: 8 },
      { name: 'ASUS Prime B550M-A', category: 'Motherboard', price: 6200, stock: 5 },
      { name: 'NVIDIA GTX 1660 Super', category: 'Graphics Card', price: 14500, stock: 4 },
      { name: 'Corsair Vengeance 16GB (2x8)', category: 'Memory', price: 4200, stock: 12 },
      { name: 'Samsung 970 EVO Plus 500GB', category: 'SSD', price: 5400, stock: 9 }
    ];

    for (const p of products) {
      try {
        await db.run(`INSERT OR IGNORE INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)`,
          p.name, p.category, p.price, p.stock);
        console.log('Seeded', p.name);
      } catch (e) {
        console.error('Failed to seed product', p.name, e.message || e);
      }
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (e) {
    console.error('Seeding error:', e);
    process.exit(1);
  }
})();

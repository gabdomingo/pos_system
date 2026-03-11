import { getDB } from "../config/database.js";

export async function getAllProducts(req, res) {
  try {
    const database = getDB();
    const products = await database.all("SELECT * FROM products ORDER BY id DESC");
    res.json(products);
  } catch (err) {
    console.error('getAllProducts error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function seedProducts(req, res) {
  try {
    const database = getDB();

    const sample = [
      { name: "Apple", category: "Fruits", price: 0.5, stock: 100, barcode: "0001", image: "https://via.placeholder.com/200x120?text=Apple" },
      { name: "Banana", category: "Fruits", price: 0.3, stock: 120, barcode: "0002", image: "https://via.placeholder.com/200x120?text=Banana" },
      { name: "Milk", category: "Dairy", price: 15, stock: 50, barcode: "0003", image: "https://via.placeholder.com/200x120?text=Milk" },
      { name: "Bread", category: "Bakery", price: 1.0, stock: 40, barcode: "0004", image: "https://via.placeholder.com/200x120?text=Bread" },
      { name: "Eggs", category: "Dairy", price: 15, stock: 60, barcode: "0005", image: "https://image2url.com/r2/default/images/1771458494345-3d2b50af-aeba-4178-8c83-35bc68bdda30.png" }
    ];

    for (const p of sample) {
      await database.run(
        `INSERT INTO products (name, category, price, stock, barcode, image) VALUES (?, ?, ?, ?, ?, ?)`,
        p.name,
        p.category,
        p.price,
        p.stock,
        p.barcode,
        p.image || ''
      );
    }

    const products = await database.all("SELECT * FROM products ORDER BY id DESC");
    res.json({ seeded: sample.length, products });
  } catch (err) {
    console.error('seedProducts error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function addProduct(req, res) {
  try {
    const db = getDB();
    const { name, category, price, stock, barcode, image } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const result = await db.run(`INSERT INTO products (name, category, price, stock, barcode, image) VALUES (?, ?, ?, ?, ?, ?)`, name, category || '', price || 0, stock || 0, barcode || '', image || '');
    const id = result.lastID || (result.stmt && result.stmt.lastID) || null;
    const product = await db.get(`SELECT * FROM products WHERE id = ?`, id);
    res.json(product);
  } catch (err) {
    console.error('addProduct error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getProduct(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;
    const product = await db.get(`SELECT * FROM products WHERE id = ?`, id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) {
    console.error('getProduct error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;
    const { name, category, price, stock, barcode, image } = req.body;
    try {
      const size = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
      console.log(`updateProduct: id=${id} payload-size=${size} bytes`);
    } catch (e) {}
    await db.run(`UPDATE products SET name = ?, category = ?, price = ?, stock = ?, barcode = ?, image = ? WHERE id = ?`, name, category, price, stock, barcode, image || '', id);
    const product = await db.get(`SELECT * FROM products WHERE id = ?`, id);
    res.json(product);
  } catch (err) {
    console.error('updateProduct error:', err && err.stack ? err.stack : err);
    const payload = { error: err.message || 'Unknown error' };
    if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
    res.status(500).json(payload);
  }
}

export async function deleteProduct(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;
    await db.run(`DELETE FROM products WHERE id = ?`, id);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function searchProducts(req, res) {
  try {
    const db = getDB();
    const q = (req.query.q || '').trim();
    if (!q) return getAllProducts(req, res);
    const products = await db.all(`SELECT * FROM products WHERE name LIKE ? OR category LIKE ? ORDER BY id DESC`, `%${q}%`, `%${q}%`);
    res.json(products);
  } catch (err) {
    console.error('searchProducts error:', err);
    res.status(500).json({ error: err.message });
  }
}

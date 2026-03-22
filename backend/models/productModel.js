import { getDB } from "../config/database.js";
import {
  cleanupLegacyDemoProducts,
  cleanupProductsWithoutPhotos,
  resolveProductImage,
  sanitizeCategory,
  seedDemoProducts
} from "../data/demoProducts.js";

export async function getAllProducts(req, res) {
  try {
    const database = getDB();
    const products = await database.all(
      `SELECT *
       FROM products
       WHERE image IS NOT NULL
         AND TRIM(image) <> ''
       ORDER BY id DESC`
    );
    res.json(products);
  } catch (err) {
    console.error('getAllProducts error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function seedProducts(req, res) {
  try {
    const database = getDB();
    const removedLegacy = await cleanupLegacyDemoProducts(database);
    const removedWithoutPhotos = await cleanupProductsWithoutPhotos(database);
    const result = await seedDemoProducts(database);

    const products = await database.all(
      `SELECT *
       FROM products
       WHERE image IS NOT NULL
         AND TRIM(image) <> ''
       ORDER BY id DESC`
    );
    res.json({
      ...result,
      removedLegacy,
      removedWithoutPhotos,
      products
    });
  } catch (err) {
    console.error('seedProducts error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function addProduct(req, res) {
  try {
    const db = getDB();
    const { name, category, price, stock, barcode, image } = req.body;
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) return res.status(400).json({ error: 'Name required' });
    const normalizedCategory = sanitizeCategory(category);
    if (!normalizedCategory) {
      return res.status(400).json({ error: 'Valid category required' });
    }

    const trimmedBarcode = typeof barcode === 'string' ? barcode.trim() : '';
    const resolvedImage = resolveProductImage({
      category: normalizedCategory,
      image,
      seed: trimmedBarcode || trimmedName
    });

    const result = await db.run(
      `INSERT INTO products (name, category, price, stock, barcode, image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      trimmedName,
      normalizedCategory,
      price || 0,
      stock || 0,
      trimmedBarcode,
      resolvedImage
    );
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
    const { name, category, price, stock, barcode, image, resetImage } = req.body;
    try {
      const size = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
      console.log(`updateProduct: id=${id} payload-size=${size} bytes`);
    } catch (e) {}
    const existing = await db.get(`SELECT * FROM products WHERE id = ?`, id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const normalizedCategory = sanitizeCategory(category);
    if (!normalizedCategory) {
      return res.status(400).json({ error: 'Valid category required' });
    }

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return res.status(400).json({ error: 'Name required' });
    }

    const trimmedBarcode = typeof barcode === 'string' ? barcode.trim() : '';
    const shouldResetImage = Boolean(resetImage);
    const resolvedImage = resolveProductImage({
      category: normalizedCategory,
      image,
      seed: trimmedBarcode || trimmedName || existing.barcode || existing.name,
      existingImage: shouldResetImage ? '' : existing.image,
      previousCategory: shouldResetImage ? '' : existing.category
    });

    await db.run(
      `UPDATE products
       SET name = ?, category = ?, price = ?, stock = ?, barcode = ?, image = ?
       WHERE id = ?`,
      trimmedName,
      normalizedCategory,
      price || 0,
      stock || 0,
      trimmedBarcode,
      resolvedImage,
      id
    );
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
    const products = await db.all(
      `SELECT *
       FROM products
       WHERE image IS NOT NULL
         AND TRIM(image) <> ''
         AND (name LIKE ? OR category LIKE ?)
       ORDER BY id DESC`,
      `%${q}%`,
      `%${q}%`
    );
    res.json(products);
  } catch (err) {
    console.error('searchProducts error:', err);
    res.status(500).json({ error: err.message });
  }
}

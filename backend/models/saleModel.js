import { getDB } from "../config/database.js";

export async function createSale(req, res) {
  try {
    const db = getDB();
    const { items, total, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Validate stock availability
    for (const it of items) {
      if (!it.id || !Number.isInteger(it.quantity) || it.quantity <= 0) {
        return res.status(400).json({ error: "Invalid item quantities" });
      }
      const product = await db.get("SELECT stock FROM products WHERE id = ?", it.id);
      if (!product || product.stock < it.quantity) {
        return res.status(400).json({ error: "Invalid stocks" });
      }
    }

    // Process sale transactionally
    await db.run("BEGIN TRANSACTION");
    try {
      const userId = req.user ? req.user.id : null;
      const result = await db.run(
        `INSERT INTO sales (total, paymentMethod, createdAt, user_id) VALUES (?, ?, ?, ?)`,
        total,
        paymentMethod,
        new Date().toISOString(),
        userId
      );
      const saleId = result.lastID || result.stmt && result.stmt.lastID || null;

      for (const it of items) {
        await db.run(
          `INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
          saleId,
          it.id,
          it.quantity,
          it.price
        );

        await db.run(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          it.quantity,
          it.id
        );
      }

      await db.run("COMMIT");
      return res.json({ saleId });
    } catch (err) {
      await db.run("ROLLBACK");
      throw err;
    }
  } catch (err) {
    console.error('createSale error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function listSales(req, res) {
  try {
    const db = getDB();
    const { start, end } = req.query;
    let sales;
    if (start && end) {
      sales = await db.all(`SELECT * FROM sales WHERE datetime(createdAt) BETWEEN datetime(?) AND datetime(?) ORDER BY id DESC`, start, end);
    } else if (start) {
      sales = await db.all(`SELECT * FROM sales WHERE datetime(createdAt) >= datetime(?) ORDER BY id DESC`, start);
    } else {
      sales = await db.all(`SELECT * FROM sales ORDER BY id DESC`);
    }
    res.json(sales);
  } catch (err) {
    console.error('listSales error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getSale(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;
    const sale = await db.get(`SELECT * FROM sales WHERE id = ?`, id);
    if (!sale) return res.status(404).json({ error: 'Not found' });
    const items = await db.all(`SELECT * FROM sale_items WHERE sale_id = ?`, id);
    res.json({ ...sale, items });
  } catch (err) {
    console.error('getSale error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function voidSale(req, res) {
  try {
    const db = getDB();
    const { id } = req.params;
    const items = await db.all(`SELECT * FROM sale_items WHERE sale_id = ?`, id);
    await db.run('BEGIN TRANSACTION');
    try {
      for (const it of items) {
        await db.run(`UPDATE products SET stock = stock + ? WHERE id = ?`, it.quantity, it.product_id || it.productId || it.product_id);
      }
      await db.run(`DELETE FROM sale_items WHERE sale_id = ?`, id);
      await db.run(`DELETE FROM sales WHERE id = ?`, id);
      await db.run('COMMIT');
      res.json({ success: true });
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  } catch (err) {
    console.error('voidSale error:', err);
    res.status(500).json({ error: err.message });
  }
}

import express from "express";
import { getDB } from "../config/database.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Reports route working" });
});

router.get('/dashboard', async (req, res) => {
  try {
    const db = getDB();
    const totalProducts = await db.get('SELECT COUNT(*) as count FROM products');
    const lowStock = await db.get('SELECT COUNT(*) as count FROM products WHERE stock <= 3');
    const today = new Date().toISOString().slice(0,10);
    const totalSalesToday = await db.get("SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM sales WHERE DATE(createdAt) = ?", today);

    // recent transactions (last 5)
    const recent = await db.all(`SELECT id, total, createdAt FROM sales ORDER BY id DESC LIMIT 5`);

    // revenue for last 7 days
    const revRows = await db.all(`SELECT DATE(createdAt) as day, COALESCE(SUM(total),0) as revenue FROM sales WHERE DATE(createdAt) >= DATE('now','-6 days') GROUP BY DATE(createdAt) ORDER BY DATE(createdAt) ASC`);
    // normalize into 7-day array
    const revenueLast7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.toISOString().slice(0,10);
      const found = revRows.find(r => r.day === day);
      revenueLast7.push({ day, revenue: found ? found.revenue : 0 });
    }

    // top products (by quantity sold)
    const topProducts = await db.all(`SELECT p.id, p.name, COALESCE(SUM(si.quantity),0) as qty_sold FROM products p LEFT JOIN sale_items si ON si.product_id = p.id GROUP BY p.id ORDER BY qty_sold DESC LIMIT 5`);

    res.json({
      totalProducts: totalProducts.count || 0,
      lowStock: lowStock.count || 0,
      totalSalesToday: totalSalesToday.count || 0,
      revenueToday: totalSalesToday.revenue || 0,
      recentTransactions: recent,
      revenueLast7,
      topProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

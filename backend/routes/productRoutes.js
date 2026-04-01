import express from "express";
import { getAllProducts, seedProducts, addProduct, getProduct, updateProduct, deleteProduct, searchProducts } from "../models/productModel.js";
import { requireAuth, requireAdmin, requireAdminOrCashier } from "../middleware/authMiddleware.js";

const router = express.Router();

// Debug middleware to log incoming request info for product updates
function debugLog(req, res, next) {
	try {
		const cl = req.headers['content-length'] || '(unknown)';
		const auth = req.headers['authorization'] ? 'present' : 'missing';
		let bodySize = '(no-body)';
		try { bodySize = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8') + ' bytes'; } catch (e) {}
		console.log(`PROD-DEBUG ${req.method} ${req.originalUrl} content-length=${cl} bodySize=${bodySize} auth=${auth}`);
	} catch (e) {}
	next();
}

router.get("/", getAllProducts);
router.get("/seed", requireAuth, requireAdmin, seedProducts);
router.get("/search", searchProducts);
router.get("/:id", getProduct);
// Add product is restricted to authenticated admin/cashier users.
router.post("/", requireAuth, requireAdminOrCashier, addProduct);
// Legacy endpoints retained for compatibility, now explicitly blocked.
router.post("/public", (req, res) => res.status(403).json({ error: 'Add product requires admin or cashier login' }));
router.put("/public/:id", (req, res) => res.status(403).json({ error: 'Update product requires admin login' }));
router.put("/:id", debugLog, requireAuth, requireAdmin, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default router;

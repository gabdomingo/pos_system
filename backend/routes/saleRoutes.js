import express from "express";
import { createSale, listSales, getSale, voidSale } from "../models/saleModel.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, listSales);
router.get("/:id", requireAuth, getSale);
router.post("/", optionalAuth, createSale); // allow guest checkout
router.post("/:id/void", requireAuth, requireAdmin, voidSale);

export default router;

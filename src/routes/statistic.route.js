import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";
import {
  getLowStockProducts,
  getRecentOrders,
  getRevenue,
  getTopProduct,
} from "../controllers/statistic.controller.js";

const router = express.Router();

router.get("/low-stock", requireAuth, checkAdmin, getLowStockProducts);
router.get("/recent-orders", requireAuth, checkAdmin, getRecentOrders);
router.get("/top-products", requireAuth, checkAdmin, getTopProduct);
router.get("/revenue", requireAuth, checkAdmin, getRevenue);

export default router;

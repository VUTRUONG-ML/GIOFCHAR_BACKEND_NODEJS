import {
  lowStockProducts,
  recentOrders,
  revenue,
} from "../services/statistic.service.js";
import pool from "../config/db.js";
import { topProduct } from "../services/statistic.service.js";
import { asyncHandler } from "../errors/errorHandler.js";

export const getRevenue = asyncHandler(async (req, res) => {
  const day = Number(req.query.range);
  if (day !== 7 && day !== 30 && day !== 90)
    return res.status(400).json({ message: "Invalid range day" });
  const result = await revenue({ conn: pool, range: Number(day) });
  return res.status(200).json({ revenue: result });
});

export const getTopProduct = asyncHandler(async (req, res) => {
  const result = await topProduct({});
  return res.status(200).json({ topProducts: result });
});

export const getRecentOrders = asyncHandler(async (req, res) => {
  const orders = await recentOrders({});
  return res.status(200).json({ orders });
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await lowStockProducts();
  return res.status(200).json({ products });
});

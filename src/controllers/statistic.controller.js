import {
  lowStockProducts,
  recentOrders,
  revenue,
} from "../services/statistic.service.js";
import pool from "../config/db.js";
import { topProduct } from "../services/statistic.service.js";
export const getRevenue = async (req, res) => {
  const day = Number(req.query.range);
  if (day !== 7 && day !== 30 && day !== 90)
    return res.status(400).json({ message: "Invalid range day" });
  try {
    const result = await revenue({ conn: pool, range: Number(day) });
    return res.status(200).json({ revenue: result });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getTopProduct = async (req, res) => {
  try {
    const result = await topProduct({});
    return res.status(200).json({ topProducts: result });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const orders = await recentOrders({});
    return res.status(200).json({ orders });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const products = await lowStockProducts({});
    return res.status(200).json({ products });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

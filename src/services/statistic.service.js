import pool from "../config/db.js";
import { classificationStockLevel, getTopProducts } from "../utils/food.js";
import {
  buildLast7DaysRevenue,
  buildLastNDaysRevenue,
} from "../utils/statistic.js";

export const revenue = async ({ conn = pool, range = 7 }) => {
  let condition;
  switch (range) {
    case 30:
      condition = "o.createdAt >= CURDATE() - INTERVAL 27 DAY";
      break;
    case 90:
      condition = "o.createdAt >= CURDATE() - INTERVAL 89 DAY";
      break;
    default:
      condition = "o.createdAt >= CURDATE() - INTERVAL 6 DAY";
      break;
  }
  try {
    const sql = `SELECT
                    DATE(o.createdAt) AS date,
                    SUM(oi.totalPrice ) AS revenue
                FROM orders o
                JOIN order_items oi ON o.id = oi.orderID
                WHERE ${condition}
                    AND o.createdAt < CURDATE() + INTERVAL 1 DAY 
                GROUP BY date`;
    const [rows] = await conn.execute(sql);
    // mốc thời gian là 30 nhưng chỉ hiển thị 28 ngày thôi
    return range === 7
      ? buildLast7DaysRevenue(rows)
      : range === 30
      ? buildLastNDaysRevenue(rows, 28, 4)
      : buildLastNDaysRevenue(rows, 90, 3);
  } catch (error) {
    console.log(">>> SERVICE revenue ERROR:", error.message);
    throw error;
  }
};

export const topProduct = async ({ conn = pool }) => {
  const top = 3;
  try {
    const sql = `SELECT 
      f.foodName,
      SUM(oi.quantity  ) as countSold
    FROM foods f 
    JOIN order_items oi ON f.id = oi.foodID 
    GROUP BY f.id
    ORDER BY countSold DESC`;
    const [rows] = await conn.execute(sql);
    return getTopProducts(rows, top);
  } catch (error) {
    console.log(">>> SERVICE topProduct ERROR:", error.message);
    throw error;
  }
};

export const recentOrders = async ({ conn = pool }) => {
  try {
    const sql = `
      SELECT
        o.id AS orderId,
        o.orderCode,
        o.status,
        o.customerName,
        
        SUM(oi.totalPrice ) as amount
      FROM orders o 
      JOIN order_items oi  ON o.id = oi.orderID
      GROUP BY o.id
      ORDER BY o.createdAt
    `;
    const [rows] = await conn.execute(sql);
    const result = rows.map((r) => ({ ...r, amount: Number(r.amount) }));
    return result.slice(0, 8);
  } catch (error) {
    console.log(">>> SERVICE recentOrders ERROR:", error.message);
    throw error;
  }
};

export const lowStockProducts = async ({ conn = pool }) => {
  try {
    const sql = `
      SELECT 
        id as foodId,
        f.foodName,
        f.stock 
      FROM foods f 
      WHERE f.stock <= 15
    `;
    const [rows] = await conn.execute(sql);
    return classificationStockLevel(rows);
  } catch (error) {
    console.log(">>> SERVICE lowStockProducts ERROR:", error.message);
    throw error;
  }
};

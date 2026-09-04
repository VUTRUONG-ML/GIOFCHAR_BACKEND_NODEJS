import pool from "../config/db.js";
import { classificationStockLevel, getTopProducts } from "../utils/food.js";
import {
  buildLast7DaysRevenue,
  buildLastNDaysRevenue,
} from "../utils/statistic.js";

export const revenue = async ({ conn = pool, range = 7 }) => {
  if (isNaN(range)) throw new Error("Invalid range day.");
  let condition;
  switch (range) {
    case 30:
      condition = "p.createdAt >= CURDATE() - INTERVAL 27 DAY";
      break;
    case 90:
      condition = "p.createdAt >= CURDATE() - INTERVAL 89 DAY";
      break;
    default:
      condition = "p.createdAt >= CURDATE() - INTERVAL 6 DAY";
      break;
  }
  const sql = `
                SELECT
                  DATE(p.createdAt) AS date,
                  SUM(amount) AS revenue
                FROM payments p
                WHERE ${condition}
                    AND p.createdAt < CURDATE() + INTERVAL 1 DAY
                    AND p.status = "success"
                GROUP BY date`;
  const [rows] = await conn.execute(sql);
  // mốc thời gian là 30 nhưng chỉ hiển thị 28 ngày thôi
  return range === 7
    ? buildLast7DaysRevenue(rows)
    : range === 30
      ? buildLastNDaysRevenue(rows, 28, 4)
      : buildLastNDaysRevenue(rows, 90, 3);
};

export const topProduct = async ({ conn = pool }) => {
  const top = 3;
  const sql = `
      SELECT 
        f.foodName,
        SUM(oi.quantity) as countSold
      FROM food_variants fv
      JOIN foods f ON fv.foodID = f.id
      JOIN order_items oi ON fv.id = oi.food_variantID
      GROUP BY f.id
      ORDER BY countSold DESC`;
  const [rows] = await conn.execute(sql);
  return getTopProducts(rows, top);
};

export const recentOrders = async ({ conn = pool }) => {
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
      ORDER BY o.createdAt DESC
    `;
  const [rows] = await conn.execute(sql);
  const result = rows.map((r) => ({ ...r, amount: Number(r.amount) }));
  return result.slice(0, 8);
};

export const lowStockProducts = async (conn = pool) => {
  const sql = `
      SELECT
        fv.id as variantId,
        f.foodName,
        fv.weight_gram,
        fv.stock 
      FROM food_variants fv 
      JOIN foods f ON fv.foodID = f.id
      WHERE fv.stock  <= 15
    `;
  const [rows] = await conn.execute(sql);
  return classificationStockLevel(rows);
};

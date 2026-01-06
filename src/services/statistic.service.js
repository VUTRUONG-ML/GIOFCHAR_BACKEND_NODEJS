import pool from "../config/db.js";
import {
  buildLast30DaysRevenue,
  buildLast7DaysRevenue,
} from "../utils/statistic.js";

export const revenue = async ({ conn = pool, range = 7 }) => {
  console.log("check service:", range);
  let condition;
  switch (range) {
    case 30:
      condition = "o.createdAt >= CURDATE() - INTERVAL 27 DAY ";
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
    return range === 7
      ? buildLast7DaysRevenue(rows)
      : buildLast30DaysRevenue(rows);
  } catch (error) {
    console.log(">>> SERVICE revenue ERROR:", error.message);
    throw error;
  }
};

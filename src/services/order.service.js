import pool from "../config/db.js";
import { generateOrderCode, groupOrders } from "../utils/order.util.js";
import { switchCustomer } from "../utils/switchCustomer.js";
import { validateOwner } from "./validators.js";

const getAllOrders = async () => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        o.id AS orderId,
        o.orderCode,
        o.status,
        o.paymentStatus,
        o.customerName,
        o.email,
        o.phone,
        o.address AS deliveryAddress,
        o.createdAt AS time,

        SUM(oi.quantity ) as totalQuantity,
        SUM(oi.totalPrice ) as amount
      FROM orders o 
      JOIN order_items oi  ON o.id = oi.orderID
      GROUP BY o.id
      ORDER BY o.createdAt DESC`);
    return rows;
  } catch (err) {
    throw err;
  }
};

const countTodayOrders = async (conn = pool) => {
  try {
    const [result] = await conn.execute(
      `
      SELECT COUNT(o.id) as countOrdered
      FROM orders o
      WHERE o.createdAt >= CURDATE() AND o.createdAt < CURDATE() + INTERVAL 1 DAY
      `,
    );
    return result[0].countOrdered;
  } catch (error) {
    console.log(">>> SERVICE countTodayOrders ERROR:", error.message);
    throw error;
  }
};

const countYesterdayOrders = async (conn = pool) => {
  try {
    const [result] = await conn.execute(
      `
      SELECT COUNT(o.id) as countOrdered
      FROM orders o
      WHERE o.createdAt >= CURDATE() - INTERVAL 1 DAY AND o.createdAt < CURDATE()
      `,
    );
    return result[0].countOrdered;
  } catch (error) {
    console.log(">>> SERVICE countYesterdayOrders ERROR:", error.message);
    throw error;
  }
};

const getOrderById = async (orderId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        o.id AS orderId,
        o.orderCode,
        o.status,
        o.paymentStatus,
        o.address AS deliveryAddress,
        o.createdAt AS time
      FROM orders o 
      WHERE id = ?`,
      [orderId],
    );
    return rows;
  } catch (err) {
    throw err;
  }
};

const getOrdersByUserId = async (userId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        o.id AS orderId,
        o.orderCode,
        o.status,
        o.createdAt AS time,

        (SELECT SUM(oi2.totalPrice )
        FROM order_items oi2 
        WHERE oi2.orderID = o.id
        ) AS amount,

        oi.id as orderItemId,
        f.foodName,
        f.image,
        fv.weight_gram,
        oi.totalPrice,
        oi.quantity
      FROM orders o 
      JOIN order_items oi  ON o.id = oi.orderID
      JOIN food_variants fv ON oi.food_variantID = fv.id
      JOIN foods f ON fv.foodID = f.id
      WHERE o.userID = ?
      ORDER BY o.createdAt`,
      [userId],
    );
    const newRows = groupOrders(rows);
    return newRows;
  } catch (err) {
    throw err;
  }
};

const createOrder = async (
  connection,
  { userId, guestToken },
  customerName,
  email,
  phone,
  address,
) => {
  try {
    validateOwner({ userId, guestToken });

    let field, value;
    if (userId) {
      field = "userID";
      value = userId;
    } else {
      field = "guestToken";
      value = guestToken;
    }

    const [result] = await connection.execute(
      `INSERT INTO orders (${field}, customerName, email, phone, address) VALUES (?, ?, ?, ?, ?)`,
      [value, customerName, email, phone, address],
    );

    const orderId = result.insertId;
    const orderCode = generateOrderCode(orderId);

    await connection.execute("UPDATE orders SET orderCode = ? WHERE id = ?", [
      orderCode,
      orderId,
    ]);

    return { orderId: result.insertId, orderCode };
  } catch (err) {
    throw err;
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const [result] = await pool.execute(
      "UPDATE orders o SET status = ? WHERE id = ?",
      [status, orderId],
    );
    return result;
  } catch (err) {
    throw err;
  }
};

const deleteOrder = async (orderId) => {
  try {
    const [result] = await pool.execute("DELETE FROM orders WHERE id = ?", [
      orderId,
    ]);

    return result;
  } catch (err) {
    throw err;
  }
};

const getOrderByIdAndUser = async (orderId, { userId, guestToken }) => {
  try {
    const { field, value } = switchCustomer({ userId, guestToken });
    const [result] = await pool.execute(
      `SELECT * FROM orders WHERE id = ? AND ${field} = ?`,
      [orderId, value],
    );
    return result.length > 0 ? result[0] : null;
  } catch (err) {
    throw err;
  }
};

const attachOrderToUser = async ({ guestToken, userId, orderId }) => {
  if (!guestToken) return;
  try {
    await pool.execute(
      `
    UPDATE orders
    SET userID = ?, guestToken = NULL
    WHERE guestToken = ? AND userID IS NULL AND id = ?
    `,
      [userId, guestToken, orderId],
    );
  } catch (error) {
    console.log(">>>>> SERVICE ERROR attach order:", error.message);
    throw error;
  }
};

const revenue = async (conn = pool, time = "default") => {
  const optionTime =
    time === "today"
      ? "WHERE o.createdAt >= CURDATE() AND o.createdAt < CURDATE() + INTERVAL 1 DAY"
      : time === "yesterday"
        ? "WHERE o.createdAt >= CURDATE() - INTERVAL 1 DAY AND o.createdAt < CURDATE()"
        : "";
  try {
    const [result] = await conn.execute(
      `
        SELECT 
          SUM(amount) as revenue
        FROM (SELECT 
                SUM(oi.totalPrice ) as amount
                FROM orders o
                JOIN order_items oi ON o.id = oi.orderID 
                ${optionTime}
                GROUP BY o.id) ordersAmount;
      `,
    );
    return result[0].revenue ? Number(result[0].revenue) : 0;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR revenue:", error.message);
    throw error;
  }
};
export default {
  getAllOrders,
  countTodayOrders,
  countYesterdayOrders,
  getOrdersByUserId,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderById,
  getOrderByIdAndUser,
  attachOrderToUser,
  revenue,
};

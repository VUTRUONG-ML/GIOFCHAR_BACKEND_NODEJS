const pool = require("../config/db");
const { generateOrderCode } = require("../utils/order.util");
const { switchCustomer } = require("../utils/switchCustomer");
const { validateOwner } = require("./validators");

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
      `
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
      `
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
      [orderId]
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
		    oi.quantity
      FROM orders o 
      JOIN order_items oi  ON o.id = oi.orderID
      JOIN foods f ON f.id = oi.foodID 
   	  WHERE o.userID = ?
      ORDER BY o.createdAt`,
      [userId]
    );
    return rows;
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
  address
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
      [value, customerName, email, phone, address]
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

const updateOrder = async ({ orderId, status, paymentStatus }, conn = pool) => {
  try {
    const [result] = await conn.execute(
      "UPDATE orders o SET status = ?, paymentStatus = ? WHERE id = ?",
      [status, paymentStatus, orderId]
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
      `SELECT id as orderId FROM orders WHERE id = ? AND ${field} = ?`,
      [orderId, value]
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
      [userId, guestToken, orderId]
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
      `
    );
    return result[0].revenue ? Number(result[0].revenue) : 0;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR revenue:", error.message);
    throw error;
  }
};

const getPaymentStatus = async (orderId) => {
  try {
    const sql = `SELECT id as orderId, paymentStatus FROM orders WHERE id = ?`;
    const [rows] = await pool.execute(sql, [orderId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log(">>> SERVICE ORDER ERROR:", error.message);
    throw error;
  }
};
const getByOrderCode = async ({ orderCode }, conn = pool) => {
  try {
    const sql = `
      SELECT
        o.id as orderId,
        o.status,
        o.paymentStatus,
        SUM(oi.totalPrice) as amount
      FROM orders o 
      JOIN order_items oi ON o.id = oi.orderID 
      WHERE o.orderCode = ?
      GROUP BY  o.id
    `;
    const [rows] = await conn.execute(sql, [orderCode]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log(">>> SERVICE ORDER ERROR:", error.message);
    throw error;
  }
};
module.exports = {
  getAllOrders,
  countTodayOrders,
  countYesterdayOrders,
  getOrdersByUserId,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
  getOrderByIdAndUser,
  attachOrderToUser,
  revenue,
  getByOrderCode,
  getPaymentStatus,
};

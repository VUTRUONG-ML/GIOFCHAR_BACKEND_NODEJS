const pool = require("../config/db");
const { generateOrderCode } = require("../utils/order.util");
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
      ORDER BY o.createdAt`);
    return rows;
  } catch (err) {
    throw err;
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
        o.paymentStatus,
        o.address AS deliveryAddress,
        o.createdAt AS time
      FROM orders o 
      WHERE o.userID = ?`,
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

    return result.insertId;
  } catch (err) {
    throw err;
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const [result] = await pool.execute(
      "UPDATE orders o SET status = ? WHERE id = ?",
      [status, orderId]
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

const getOrderByIdAndUser = async (orderId, userId) => {
  try {
    const [result] = await pool.execute(
      "SELECT * FROM orders WHERE id = ? AND userID = ?",
      [orderId, userId]
    );
    return result.length > 0 ? result[0] : null;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getAllOrders,
  getOrdersByUserId,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderById,
  getOrderByIdAndUser,
};

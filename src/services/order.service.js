const pool = require("../config/db");

const getAllOrders = async () => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        o.id AS orderId,
        o.status,
        o.paymentStatus,
        o.address AS deliveryAddress,
        o.createdAt AS time,
        u.id AS userId,
        u.userName,
        u.email,
        u.phone
      FROM orders o 
      LEFT JOIN users u ON o.userID = u.id`);
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

const createOrder = async (connection, userId, address) => {
  try {
    const [result] = await connection.execute(
      `INSERT INTO orders (userID, address) VALUES (?, ?)`,
      [userId, address]
    );

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

module.exports = {
  getAllOrders,
  getOrdersByUserId,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderById,
};

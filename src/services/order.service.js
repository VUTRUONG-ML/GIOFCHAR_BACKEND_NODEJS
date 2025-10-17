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

module.exports = {
  getAllOrders,
  getOrdersByUserId,
};

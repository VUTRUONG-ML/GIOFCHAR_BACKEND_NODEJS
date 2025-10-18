const pool = require("../config/db");

const getOrderItemsByOrderId = async (orderId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        oi.id AS orderItemId,
        f.id AS foodId,
        f.foodName,
        f.price,
        oi.quantity,
        f.image,
        oi.totalPrice,
        oi.orderID
      FROM order_items oi 
      JOIN foods f ON oi.foodID = f.id 
      WHERE orderID = ?`,
      [orderId]
    );
    return rows;
  } catch (err) {
    throw err;
  }
};

const createOrderItem = async (connection, orderValues) => {
  // orderValues : array[[orderID, foodID, quantity, totalPrice]]
  try {
    // muốn thêm nhiều dòng dữ liệu thì dùng query
    const [result] = await connection.query(
      "INSERT INTO order_items (orderID, foodID, quantity, totalPrice) VALUES ?",
      [orderValues]
    );
    return result.insertId;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getOrderItemsByOrderId,
  createOrderItem,
};

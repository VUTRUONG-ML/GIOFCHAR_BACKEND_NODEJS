const pool = require("../config/db");

const getOrderItemsByOrderId = async (orderId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        o.id AS orderId,
        o.orderCode,
        o.createdAt,
        o.address,
        o.status,
        
        oi.id AS orderItemId,
        oi.quantity,
        oi.totalPrice as totalPriceOnOneItem,
        
        f.id AS foodId,
        f.foodName,
        f.image,
        f.price,
        
        u.userName,
        u.email,
        
        p.paymentType,
        p.status as paymentStatus
      FROM orders o
      JOIN users u ON o.userID = u.id 
      JOIN order_items oi ON o.id = oi.orderID
      JOIN foods f ON oi.foodID = f.id 
      JOIN payments p ON o.id = p.orderID
      WHERE o.id = ?`,
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

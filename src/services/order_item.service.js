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

module.exports = {
  getOrderItemsByOrderId,
};

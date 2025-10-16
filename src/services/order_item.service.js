const pool = require("../config/db");

const getOrderItemsByOrderId = async (orderId) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM order_items WHERE orderID = ?",
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

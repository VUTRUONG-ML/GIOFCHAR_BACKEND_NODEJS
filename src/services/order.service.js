const pool = require("../config/db");

const getAllOrders = async () => {
  try {
    const [rows] = await pool.execute("SELECT * FROM orders");
    return rows;
  } catch (err) {
    throw err;
  }
};

const getOrdersByUserId = async (userId) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM orders WHERE userID = ?", [
      userId,
    ]);
    return rows;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getAllOrders,
  getOrdersByUserId,
};

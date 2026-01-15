const pool = require("../config/db");

const getAllPayments = async () => {
  try {
    const [rows] = await pool.execute("SELECT * FROM payments");

    return rows;
  } catch (err) {
    throw err;
  }
};

const getPaymentById = async (paymentId) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM payments WHERE id = ?", [
      paymentId,
    ]);
    return rows;
  } catch (err) {
    throw err;
  }
};

const updatePaymentById = async (paymentId, paymentStatus, paymentType) => {
  try {
    const [result] = await pool.execute(
      `UPDATE payments p 
        SET paymentType = ?, status = ? 
        WHERE id = ?`,
      [paymentType, paymentStatus, paymentId]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

const createPayment = async (
  conn,
  orderID,
  paymentType,
  amount,
  transactionId,
  paymentStatus
) => {
  try {
    const provider = "vnpay";
    let sql = "";
    let values = [];
    if (paymentType === "COD") {
      sql = `INSERT INTO payments (orderID, paymentType, amount, transactionID, status) 
              VALUES (?, ?, ?, ?, ?)`;
      values = [orderID, paymentType, amount, transactionId, paymentStatus];
    } else {
      sql = `INSERT INTO payments (orderID, paymentType, amount, transactionID, status, provider) 
              VALUES (?, ?, ?, ?, ?, ?)`;
      values = [
        orderID,
        paymentType,
        amount,
        transactionId,
        paymentStatus,
        provider,
      ];
    }
    const [result] = await conn.execute(sql, values);
    return result;
  } catch (err) {
    throw err;
  }
};

const deletePayment = async (paymentId) => {
  try {
    const [result] = await pool.execute("DELETE FROM payments WHERE id = ?", [
      paymentId,
    ]);
    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  updatePaymentById,
  createPayment,
  deletePayment,
};

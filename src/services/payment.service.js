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
  orderID,
  paymentType,
  amount,
  transactionId,
  paymentStatus
) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO payments (orderID, paymentType, amount, transactionID, status) 
        VALUES (?, ?, ?, ?, ?)`,
      [orderID, paymentType, amount, transactionId, paymentStatus]
    );
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

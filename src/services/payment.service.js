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

const updatePaymentById = async (
  paymentId,
  paymentStatus,
  paymentType,
  conn = pool,
) => {
  try {
    const [result] = await conn.execute(
      `UPDATE payments p 
        SET paymentType = ?, status = ? 
        WHERE id = ?`,
      [paymentType, paymentStatus, paymentId],
    );
    return result.affectedRows === 1;
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
  paymentStatus,
) => {
  try {
    const [result] = await conn.execute(
      `INSERT INTO payments (orderID, paymentType, amount, transactionID, status) 
        VALUES (?, ?, ?, ?, ?)`,
      [orderID, paymentType, amount, transactionId, paymentStatus],
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

const getPaymentByOrderId = async (orderId, conn = pool) => {
  try {
    const sql = `
     SELECT id as paymentId, paymentType, status as paymentStatus
     FROM payments
     WHERE orderID = ?
    `;
    const [rows] = await conn.execute(sql, [orderId]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};
module.exports = {
  getAllPayments,
  getPaymentById,
  updatePaymentById,
  createPayment,
  deletePayment,
  getPaymentByOrderId,
};

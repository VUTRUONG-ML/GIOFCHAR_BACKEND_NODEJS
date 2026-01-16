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
    const [rows] = await pool.execute(
      "SELECT id as paymentId, paymentType, status, amount  FROM payments WHERE id = ?",
      [paymentId]
    );
    return rows;
  } catch (err) {
    throw err;
  }
};

const updatePaymentById = async (
  { paymentId, paymentStatus, paymentType, transactionId = "" },
  conn = pool
) => {
  try {
    const [result] = await conn.execute(
      `UPDATE payments p 
        SET paymentType = ?, status = ?, transactionID = ? 
        WHERE id = ?`,
      [paymentType, paymentStatus, transactionId, paymentId]
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

const getByOrderId = async (orderId) => {
  try {
    const sql = `
      SELECT 
        p.id as paymentId,
        p.amount,
        p.transactionID,
        p.paymentType,
        p.status as paymentStatus
      FROM  payments p
      WHERE p.orderID  = ?`;
    const [rows] = await pool.execute(sql, [orderId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log(">>> SERVICE payment ERROR:", error.message);
    throw error;
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  updatePaymentById,
  createPayment,
  deletePayment,
  getByOrderId,
};

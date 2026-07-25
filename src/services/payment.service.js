import pool from "../config/db.js";
import logger from "../config/logger.js";
import { PAYMENT_STATUS } from "../constants/field.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";
import { BadRequestError } from "../errors/AppError.js";

const getAllPayments = async () => {
  const [rows] = await pool.execute("SELECT * FROM payments");
  return rows;
};

const getPaymentById = async (paymentId) => {
  const [rows] = await pool.execute(
    "SELECT id as paymentId, paymentType, status, amount  FROM payments WHERE id = ?",
    [paymentId],
  );
  return rows;
};

const updatePaymentById = async (
  { paymentId, paymentStatus, paymentType, transactionId = "" },
  conn = pool,
) => {
  if (!PAYMENT_STATUS.includes(paymentStatus))
    throw new BadRequestError("Invalid payment status.");
  const [result] = await conn.execute(
    `UPDATE payments p
        SET paymentType = ?, status = ?, transactionID = ? 
        WHERE id = ?`,
    [paymentType, paymentStatus, transactionId, paymentId],
  );
  return result.affectedRows === 1;
};

const createPayment = async (
  conn,
  orderID,
  paymentType,
  amount,
  transactionId,
  paymentStatus,
) => {
  if (!PAYMENT_STATUS.includes(paymentStatus)) {
    logger.warn(LOG_ACTIONS.PAYMENT.CREATE, {
      status: LOG_STATUSES.FAILED,
      reason: "INVALID_STATUS",
      orderId: orderID,
      paymentType,
    });
    throw new BadRequestError("Invalid payment status.");
  }

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
};

const deletePayment = async (paymentId) => {
  const [result] = await pool.execute("DELETE FROM payments WHERE id = ?", [
    paymentId,
  ]);
  return result;
};

const getByOrderId = async (orderId) => {
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
};

const revenue = async (time = "default", conn = pool) => {
  const optionTime =
    time === "today"
      ? "AND p.createdAt >= CURDATE() AND p.createdAt < CURDATE() + INTERVAL 1 DAY"
      : time === "yesterday"
        ? "AND p.createdAt >= CURDATE() - INTERVAL 1 DAY AND p.createdAt < CURDATE()"
        : "";

  if (time !== "today" && time !== "yesterday" && time !== "default")
    throw new Error("INVALID_TIME_REVENUE");
  const sql = `
      SELECT 
        p.amount as revenue,	
        p.createdAt 
      FROM payments p
      WHERE p.status = "success"
      ${optionTime}
    `;
  const [rows] = await conn.execute(sql);
  return rows[0] ? Number(rows[0].revenue) : 0;
};
export default {
  getAllPayments,
  getPaymentById,
  updatePaymentById,
  createPayment,
  deletePayment,
  getByOrderId,
  revenue,
};

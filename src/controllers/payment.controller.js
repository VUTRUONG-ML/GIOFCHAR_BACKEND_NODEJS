import pool from "../config/db.js";
import paymentService from "../services/payment.service.js";
import { processIpn } from "../services/payments/vnpay.service.js";
import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";
import { asyncHandler } from "../errors/errorHandler.js";

const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getAllPayments();

  res.status(200).json({ payments: payments });
});

const getPaymentById = asyncHandler(async (req, res) => {
  const paymentId = req.params.paymentId;
  const payment = await paymentService.getPaymentById(paymentId);
  if (payment.length === 0)
    return res.status(404).json({ message: "Payment not found" });

  res.status(200).json({ payment });
});

const createPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentType, amount, transactionId, paymentStatus } =
    req.body;
  if (!orderId || !amount || !transactionId)
    return res.status(400).json({ message: "Missing field" });
  const validPaymentTypes = ["COD", "CARD"];
  const validStatuses = ["success", "failed", "pending"];

  if (
    !validPaymentTypes.includes(paymentType) ||
    !validStatuses.includes(paymentStatus)
  ) {
    return res
      .status(400)
      .json({ message: "Invalid paymentType or paymentStatus" });
  }

  const result = await paymentService.createPayment(
    orderId,
    paymentType,
    amount,
    transactionId,
    paymentStatus,
  );

  res.status(201).json({
    message: "Create payment successful",
    paymentId: result.insertId,
  });
});

const updatePayment = asyncHandler(async (req, res) => {
  const paymentId = req.params.paymentId;
  const { paymentStatus, paymentType } = req.body;
  if (!paymentStatus || !paymentType)
    return res.status(400).json({ message: "Missing field" });

  const result = await paymentService.updatePaymentById(
    { paymentId, paymentStatus, paymentType },
    pool,
  );
  if (result.affectedRows === 0)
    return res.status(404).json({ message: "Payment not found" });
  res.status(200).json({ message: "Update payment successful" });
});

const deletePayment = asyncHandler(async (req, res) => {
  const paymentId = req.params.paymentId;
  const result = await paymentService.deletePayment(paymentId);
  if (result.affectedRows === 0)
    return res.status(404).json({ message: "Payment not found" });
  res
    .status(200)
    .json({ message: "Delete payment successful", payment: paymentId });
});
const handleIpn = async (req, res, next) => {
  const connection = await pool.getConnection();
  const order = req.order;
  const payment = req.payment;
  const vnpayParams = req.vnpayParams;
  const transactionStartedAt = Date.now();
  try {
    await connection.beginTransaction();
    const result = await processIpn({
      order,
      payment,
      vnp_Params: vnpayParams,
      connection,
    });
    await connection.commit();
    logger.debug(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.COMMITTED,
      operation: "process_vnpay_ipn",
      orderId: order.orderId,
      paymentId: payment.paymentId,
      durationMs: Date.now() - transactionStartedAt,
    });
    return res.status(200).json(result);
  } catch (error) {
    await connection.rollback();
    logger.warn(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.ROLLED_BACK,
      operation: "process_vnpay_ipn",
      reason: error.code || "UNEXPECTED_ERROR",
      orderId: order.orderId,
      paymentId: payment.paymentId,
      durationMs: Date.now() - transactionStartedAt,
    });
    next(error);
  } finally {
    connection.release();
  }
};

export default {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  handleIpn,
};

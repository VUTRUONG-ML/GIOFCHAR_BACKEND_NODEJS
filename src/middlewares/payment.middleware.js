import { signVnpayParams } from "../services/payments/vnpay.service.js";
import orderService from "../services/order.service.js";
import paymentService from "../services/payment.service.js";
import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";

export function verifyVnpaySignature(req, res, next) {
  let vnp_Params = { ...req.query };
  const secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  if (vnp_Params.vnp_SecureHashType) {
    delete vnp_Params.vnp_SecureHashType;
  }

  const signed = signVnpayParams(vnp_Params);

  if (secureHash !== signed) {
    logger.warn(LOG_ACTIONS.PAYMENT.VERIFY_CALLBACK, {
      status: LOG_STATUSES.FAILED,
      reason: "INVALID_SIGNATURE",
    });
    return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  }

  req.vnpayParams = vnp_Params; // attach sang request
  next();
}

export async function checkVnpayOrder(req, res, next) {
  const { vnp_TxnRef, vnp_Amount } = req.vnpayParams;
  const amount = Number(vnp_Amount) / 100;

  const order = await orderService.getByOrderCode({ orderCode: vnp_TxnRef });
  if (!order) {
    logger.warn(LOG_ACTIONS.PAYMENT.VALIDATE_CALLBACK, {
      status: LOG_STATUSES.FAILED,
      reason: "ORDER_NOT_FOUND",
      orderCode: vnp_TxnRef,
    });
    return res.json({ RspCode: "01", Message: "Order not found" });
  }

  const payment = await paymentService.getByOrderId(order.orderId);
  if (!payment) {
    logger.warn(LOG_ACTIONS.PAYMENT.VALIDATE_CALLBACK, {
      status: LOG_STATUSES.FAILED,
      reason: "PAYMENT_NOT_FOUND",
      orderId: order.orderId,
    });
    return res.json({ RspCode: "01", Message: "Payment not found" });
  }

  if (Number(order.amount) !== amount || Number(payment.amount) !== amount) {
    logger.warn(LOG_ACTIONS.PAYMENT.VALIDATE_CALLBACK, {
      status: LOG_STATUSES.FAILED,
      reason: "AMOUNT_MISMATCH",
      orderId: order.orderId,
    });
    return res.json({ RspCode: "04", Message: "Amount invalid" });
  }

  req.order = order;
  req.payment = payment;
  next();
}

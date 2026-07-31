import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";

export function errorHandler(err, req, res, next) {
  // IPN VNPAY: luôn trả 200
  if (req.originalUrl.includes("/vnpay/ipn")) {
    logger.error(LOG_ACTIONS.PAYMENT.PROCESS_CALLBACK, {
      status: LOG_STATUSES.FAILED,
      reason: err.code || "UNEXPECTED_ERROR",
      requestId: req.requestId,
      orderId: req.order?.orderId,
      paymentId: req.payment?.paymentId,
      message: err.message,
    });
    return res.status(200).json({
      RspCode: "99",
      Message: "Internal server error",
    });
  }
  const statusCode = err.statusCode || 500;
  if (statusCode === 500) {
    logger.error(LOG_ACTIONS.SYSTEM.UNHANDLED_ERROR, {
      status: LOG_STATUSES.FAILED,
      requestId: req.requestId,
      message: err.message,
      stack: err.stack,
      context: err.context || {},
    });
    return res.status(statusCode).json({
      message: "Server error",
      requestId: req.requestId,
    });
  }
  return res.status(statusCode).json({
    message: err.message,
    code: err.code || "INTERNAL_ERROR",
  });
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Wrap controller execution into a Promise
// - sync throw  -> Promise.reject
// - async reject -> Promise.reject
// => forward all errors to Express error handler

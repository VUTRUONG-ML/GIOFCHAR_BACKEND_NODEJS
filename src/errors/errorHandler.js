export function errorHandler(err, req, res, next) {
  console.error(">>> Error global:", err);

  // IPN VNPAY: luôn trả 200
  if (req.originalUrl.includes("/vnpay/ipn")) {
    return res.status(200).json({
      RspCode: "99",
      Message: "Internal server error",
    });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode === 500) {
    return res.status(statusCode).json({
      message: "Server error",
      error: err.message,
    });
  }
  return res.status(statusCode).json({
    message: err.message,
  });
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Wrap controller execution into a Promise
// - sync throw  -> Promise.reject
// - async reject -> Promise.reject
// => forward all errors to Express error handler

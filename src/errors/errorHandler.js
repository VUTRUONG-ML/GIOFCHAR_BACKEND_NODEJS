export function errorHandler(err, req, res, next) {
  console.error(">>> Error global:", err);

  // IPN VNPAY: luôn trả 200
  if (req.originalUrl.includes("/vnpay/ipn")) {
    return res.status(200).json({
      RspCode: "99",
      Message: "Internal server error",
    });
  }

  res.status(500).json({
    message: "Server error",
    error: err.message,
  });
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

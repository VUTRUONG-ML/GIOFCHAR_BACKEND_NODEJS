import orderService from "../services/order.service.js";
import { asyncHandler } from "../errors/errorHandler.js";

export const checkOrderExists = asyncHandler(async (req, res, next) => {
  const orderId = req.body.orderId;
  const result = await orderService.getOrderById(orderId);
  if (result.length === 0)
    return res.status(404).json({ message: "Order not found" });
  req.order = result[0];
  return next();
});

export const checkOrderByOrderCode = asyncHandler(async (req, res, next) => {
  const orderCode = req.body.orderCode || req.params.orderCode;
  const order = await orderService.getByOrderCode({ orderCode });
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.has_viewed_payment_result)
    return res.status(403).json({ message: "Payment cannot be reviewed" });

  await orderService.markPaymentResultViewed({ orderId: order.orderId });

  req.order = order;
  return next();
});

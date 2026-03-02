import orderService from "../services/order.service.js";

export const checkOrderExists = async (req, res, next) => {
  const orderId = req.body.orderId;
  try {
    const result = await orderService.getOrderById(orderId);
    if (result.length === 0)
      return res.status(404).json({ message: "Order not found" });
    req.order = result[0];
    next();
  } catch (err) {
    console.error(">>>>> MIDDLEWARE ERROR:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const checkOrderByOrderCode = async (req, res, next) => {
  const orderCode = req.body.orderCode || req.params.orderCode;
  try {
    const order = await orderService.getByOrderCode({ orderCode });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.has_viewed_payment_result)
      return res.status(403).json({ message: "Payment cannot be reviewed" });

    await orderService.markPaymentResultViewed({ orderId: order.orderId });

    req.order = order;
    next();
  } catch (err) {
    console.error(">>>>> MIDDLEWARE ERROR:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

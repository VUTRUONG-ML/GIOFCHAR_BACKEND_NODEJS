const orderService = require("../services/order.service");

const checkOrderExists = async (req, res, next) => {
  const orderId = req.body.orderId;
  try {
    const result = await orderService.getOrderById(orderId);
    if (result.length === 0)
      return res.status(404).json({ message: "Order not found" });

    next();
  } catch (err) {
    console.error(">>>>> MIDDLEWARE ERROR:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  checkOrderExists,
};

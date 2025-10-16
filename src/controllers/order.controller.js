const orderService = require("../services/order.service");
const orderItemService = require("../services/order_item.service");

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json({ total: orders.length, orders: orders });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getOrdersByUserId = async (req, res) => {
  const userId = req.params.userId;
  try {
    const orders = await orderService.getOrdersByUserId(userId);
    res.status(200).json({ total: orders.length, orders });
  } catch (error) {
    console.log(">>>>> CONTROLLER ERROR", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getOrderItemsByOrderId = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const items = await orderItemService.getOrderItemsByOrderId(orderId);
    if (items.length === 0)
      return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ total: items.length, items });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR getOrderItemsByOrderId", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllOrders,
  getOrdersByUserId,
  getOrderItemsByOrderId,
};

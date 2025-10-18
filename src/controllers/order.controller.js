const orderService = require("../services/order.service");
const orderItemService = require("../services/order_item.service");
const cartItemService = require("../services/cartItem.service");
const cartService = require("../services/cart.service");
const pool = require("../config/db");

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

const createOrder = async (req, res) => {
  // cần phải có userId từ params, từ userId -> cartId -> cartItems
  const userId = req.params.userId; // sau này sẽ lấy từ middleware req.userId
  const cartId = req.cartId; // từ middleware
  const address = req.body.address;
  if (!address)
    return res.status(400).json({ message: "Missing field address" });

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction(); // Khởi tạo transaction

    const orderId = await orderService.createOrder(connection, userId, address);
    const cartItems = await cartItemService.getCartItemsByCartId(cartId);
    if (cartItems.length === 0)
      return res.status(400).json({ message: "Empty cart items" });

    let totalPriceOrder = 0;
    const orderValues = cartItems.map((item) => {
      const totalPriceItem = item.quantity * item.price;
      totalPriceOrder += totalPriceItem;
      return [orderId, item.foodId, item.quantity, totalPriceItem];
    });

    const result = await orderItemService.createOrderItem(
      connection,
      orderValues
    );
    await connection.commit();

    await cartService.clearCart(cartId);

    res.status(200).json({
      message: "Create order successful",
      orderId,
      totalPriceOrder: totalPriceOrder,
    });
  } catch (err) {
    await connection.rollback(); // rollback nếu lỗi
    console.error(">>>>> CONTROLLER ERROR Transaction failed:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
};

const updateOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const status = req.body.status;
  if (
    !status ||
    (status !== "delivering" &&
      status !== "unconfirmed" &&
      status !== "cancelled" &&
      status !== "delivered")
  ) {
    return res.status(400).json({ message: "Missing or incorrect status" });
  }
  try {
    const result = await orderService.updateOrderStatus(orderId, status);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Update order status successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const status = "cancelled";
  try {
    const result = await orderService.updateOrderStatus(orderId, status);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Cancel order successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteOrder = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const result = await orderService.deleteOrder(orderId);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Delete order successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
module.exports = {
  getAllOrders,
  getOrdersByUserId,
  getOrderItemsByOrderId,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
};

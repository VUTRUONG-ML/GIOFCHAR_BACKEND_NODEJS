const orderService = require("../services/order.service");
const orderItemService = require("../services/order_item.service");
const cartItemService = require("../services/cartItem.service");
const cartService = require("../services/cart.service");
const paymentService = require("../services/payment.service");
const { calculateOrderValues } = require("../utils/order.util");
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
  const userId = req.user.userId;
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

    // gộp các trường dùng chung

    const {
      createdAt,
      orderCode,
      status,
      userName,
      email,
      paymentType,
      paymentStatus,
      address,
    } = items[0];

    const itemList = items.map(
      ({
        orderCode,
        createdAt,
        status,
        userName,
        email,
        paymentType,
        paymentStatus,
        address,
        ...rest
      }) => rest
    );

    //tinh tong tien cua order
    const amountOrder = itemList.reduce(
      (sum, item) => sum + Number(item.totalPriceOnOneItem),
      0
    );

    res.status(200).json({
      totalItem: items.length,
      orderCode,
      createdAt,
      orderStatus: status,
      address,
      amountOrder,
      userName,
      email,
      paymentType,
      paymentStatus,
      items: itemList,
    });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR getOrderItemsByOrderId", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createOrder = async (req, res) => {
  // cần phải có userId từ params, từ userId -> cartId -> cartItems
  const userId = req.user.userId; // sau này sẽ lấy từ middleware req.userId
  const cartId = req.cartId; // từ middleware
  const address = req.body.address;
  if (!address)
    return res.status(400).json({ message: "Missing field address" });

  const connection = await pool.getConnection();

  try {
    //Lay ve cartItem cua nguoi dung hien tai
    const cartItems = await cartItemService.getCartItemsByCartId(cartId);
    if (cartItems.length === 0)
      return res.status(400).json({ message: "Empty cart items" });

    await connection.beginTransaction(); // Khởi tạo transaction
    //Tao order
    const orderId = await orderService.createOrder(connection, userId, address);

    // Tinh cac gia tri de dua vao tao orderItem
    const { orderValues, totalPriceOrder } = calculateOrderValues(
      cartItems,
      orderId
    );

    const result = await orderItemService.createOrderItem(
      connection,
      orderValues
    );
    await connection.commit();

    const paymentTypeDefault = "COD";
    const transactionDefault = "COD";
    const paymentStatusDefault = "pending";
    await paymentService.createPayment(
      orderId,
      paymentTypeDefault,
      totalPriceOrder,
      transactionDefault,
      paymentStatusDefault
    );
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

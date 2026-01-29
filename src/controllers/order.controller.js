import orderService from "../services/order.service.js";
import orderItemService from "../services/order_item.service.js";
import cartItemService from "../services/cartItem.service.js";
import cartService from "../services/cart.service.js";
import paymentService from "../services/payment.service.js";
import { calculateOrderValues } from "../utils/order.util.js";
import pool from "../config/db.js";
import foodService from "../services/food.service.js";
import { statusOverview } from "../utils/status.js";
import { deductStockForOrder } from "../services/variant.service.js";
import { BadRequestError } from "../errors/AppError.js";

const getStatusOverview = async (req, res) => {
  try {
    const resultToday = await orderService.countTodayOrders();
    const resultYes = await orderService.countYesterdayOrders();

    const { status, percent } = statusOverview(resultToday, resultYes);
    return res
      .status(200)
      .json({ countTodayOrders: resultToday, status, percent });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getStatusRevenue = async (req, res) => {
  try {
    const revenueToday = await orderService.revenue(pool, "today");
    const revenueYesterday = await orderService.revenue(pool, "yesterday");
    const { status, percent } = statusOverview(revenueToday, revenueYesterday);
    return res.status(200).json({ revenueToday, status, percent });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

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
  const { role } = req.user;
  const userId = role === "admin" ? req.params.userId : req.user.userId;

  const orders = await orderService.getOrdersByUserId(userId);
  return res.status(200).json({ total: orders.length, orders });
};

const getOrderItemsByOrderId = async (req, res) => {
  const orderId = req.params.orderId;
  const order = await orderItemService.getOrderItemsByOrderId(orderId);
  return res.status(200).json(order);
};

const createOrder = async (req, res) => {
  // cần phải có userId từ params, từ userId -> cartId -> cartItems
  const { userId, guestToken } = req.user; // sau này sẽ lấy từ middleware req.userId
  const { customerName, email, phone, address } = req.body;
  if (!address || !customerName || !email || !phone)
    return res.status(400).json({ message: "Missing field" });

  const result = await cartService.withCart(
    req.user,
    async ({ cartId, conn }) => {
      //Lay ve cartItem cua nguoi dung hien tai
      const cartItems = await cartItemService.getCartItemsByCartId(
        cartId,
        conn,
        true,
      );
      if (cartItems.length === 0)
        throw new BadRequestError("Your shopping cart is empty.");

      // Kiểm tra và trừ đi quatity trước khi thêm vào orderItems
      await deductStockForOrder(conn, cartItems);

      //Tao order
      const { orderId, orderCode } = await orderService.createOrder(
        conn,
        { userId, guestToken },
        customerName,
        email,
        phone,
        address,
      );

      // Tinh cac gia tri de dua vao tao orderItem
      const { orderValues, totalPriceOrder } = calculateOrderValues(
        cartItems,
        orderId,
      );

      await orderItemService.createOrderItem(conn, orderValues);

      const paymentTypeDefault = "COD";
      const transactionDefault = "COD";
      const paymentStatusDefault = "pending";
      await paymentService.createPayment(
        conn,
        orderId,
        paymentTypeDefault,
        totalPriceOrder,
        transactionDefault,
        paymentStatusDefault,
      );
      await cartService.clearCart(cartId, conn);

      return { orderId, orderCode, totalPriceOrder };
    },
  );

  const { orderId, orderCode, totalPriceOrder } = result;

  res.status(200).json({
    message: "Create order successful",
    orderCode,
    orderId,
    totalPriceOrder,
  });
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
export default {
  getAllOrders,
  getOrdersByUserId,
  getOrderItemsByOrderId,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getStatusOverview,
  getStatusRevenue,
};

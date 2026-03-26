import orderService from "../services/order.service.js";
import orderItemService from "../services/order_item.service.js";

import cartService from "../services/cart.service.js";
import paymentService from "../services/payment.service.js";

import { statusOverview } from "../utils/status.js";

import { BadRequestError, ConflictError } from "../errors/AppError.js";

import { ORDER_STATUS } from "../constants/field.js";
import logger from "../config/logger.js";
import { LOG_EVENTS } from "../constants/logEvents.js";

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
    const revenueToday = await paymentService.revenue("today");
    const revenueYesterday = await paymentService.revenue("yesterday");
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
  const { userId, guestToken } = req.user;
  const {
    cartVersion: clientVersion,
    customerName,
    email,
    phone,
    address,
    paymentMethod,
  } = req.body;
  if (!address || !customerName || !email || !phone || !paymentMethod)
    return res.status(400).json({ message: "Missing field" });

  const ipAddr =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const result = await cartService.withCart(
    req.user,
    async ({ cartId, conn, cartVersion }) => {
      if (cartVersion !== clientVersion) {
        logger.warn(LOG_EVENTS.ORDER.failed.CHECKOUT, {
          reason: "CART_VERSION_CHANGED",
          cartId,
        });
        throw new ConflictError("CART_CHANGED");
      }
      return await orderService.checkout(
        {
          cartId,
          customerName,
          email,
          phone,
          address,
          paymentMethod,
          userId,
          guestToken,
          ipAddr,
        },
        conn,
      );
    },
  );

  const { orderId, orderCode, totalPriceOrder, paymentUrl } = result;

  res.status(200).json({
    message: "Create order successful",
    orderCode,
    orderId,
    totalPriceOrder,
    paymentUrl,
  });
};

const updateOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.status;

  if (!newStatus || !ORDER_STATUS.includes(newStatus)) {
    throw new BadRequestError("Missing or incorrect status");
  }
  await orderService.updateOrder(orderId, newStatus);
  res.status(200).json({ message: "Update order status successful" });
};

const cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const status = "cancelled";

  const result = await orderService.updateOrderStatus(orderId, status);

  res.status(200).json({ message: "Cancel order successful" });
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
const getPaymentStatus = async (req, res) => {
  const { orderId } = req.order;

  try {
    const order = await orderService.getPaymentStatus(orderId);
    return res.status(200).json({ ...order });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
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
  getPaymentStatus,
};

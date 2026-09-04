import orderService from "../services/order.service.js";
import orderItemService from "../services/order_item.service.js";

import cartService from "../services/cart.service.js";
import paymentService from "../services/payment.service.js";

import { statusOverview } from "../utils/status.js";

import { BadRequestError, ConflictError, NotFoundError } from "../errors/AppError.js";
import { asyncHandler } from "../errors/errorHandler.js";

import { ORDER_STATUS } from "../constants/field.js";
import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";

const getStatusOverview = async (req, res) => {
  const resultToday = await orderService.countTodayOrders();
  const resultYes = await orderService.countYesterdayOrders();

  const { status, percent } = statusOverview(resultToday, resultYes);
  return res
    .status(200)
    .json({ countTodayOrders: resultToday, status, percent });
};

const getStatusRevenue = async (req, res) => {
  const revenueToday = await paymentService.revenue("today");
  const revenueYesterday = await paymentService.revenue("yesterday");
  
  const { status, percent } = statusOverview(revenueToday, revenueYesterday);
  return res.status(200).json({ revenueToday, status, percent });
};

const getAllOrders = async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.status(200).json({ total: orders.length, orders });
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

  logger.info(LOG_ACTIONS.ORDER.CHECKOUT, {
    status: LOG_STATUSES.STARTED,
    actorType: userId ? "user" : "guest",
    userId,
    paymentMethod,
  });

  try {
    if (!address || !customerName || !email || !phone || !paymentMethod) {
      const error = new BadRequestError("Missing field");
      error.context = { reason: "MISSING_FIELD" };
      throw error;
    }

    const ipAddr =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

    const result = await cartService.withCart(
      req.user,
      async ({ cartId, conn, cartVersion }) => {
        if (cartVersion !== clientVersion) {
          const error = new ConflictError("CART_CHANGED");
          error.context = { reason: "CART_VERSION_CHANGED", cartId };
          throw error;
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
      { operation: LOG_ACTIONS.ORDER.CHECKOUT },
    );

    const {
      orderId,
      orderCode,
      totalPriceOrder,
      paymentUrl,
      paymentId,
      paymentStatus,
    } = result;

    logger.info(LOG_ACTIONS.PAYMENT.CREATE, {
      status: LOG_STATUSES.CREATED,
      paymentId,
      orderId,
      amount: totalPriceOrder,
      paymentMethod,
      paymentStatus,
    });

    logger.info(LOG_ACTIONS.ORDER.CHECKOUT, {
      status: LOG_STATUSES.COMPLETED,
      orderId,
      amount: totalPriceOrder,
      paymentMethod,
    });

    res.status(200).json({
      message: "Create order successful",
      orderCode,
      orderId,
      totalPriceOrder,
      paymentUrl,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    error.context = {
      ...error.context,
      userId,
      paymentMethod,
      cartId: error.context?.cartId,
      variantId: error.context?.variantId,
    };

    if (statusCode < 500) {
      logger.warn(LOG_ACTIONS.ORDER.CHECKOUT, {
        status: LOG_STATUSES.FAILED,
        reason: error.context?.reason || error.code || "UNEXPECTED_ERROR",
        statusCode,
        userId,
        paymentMethod,
        cartId: error.context?.cartId,
        variantId: error.context?.variantId,
      });
    }
    throw error;
  }
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

  await orderService.updateOrderStatus(orderId, status);

  res.status(200).json({ message: "Cancel order successful" });
};

const deleteOrder = async (req, res) => {
  const orderId = req.params.orderId;
  
  const result = await orderService.deleteOrder(orderId);

  if (result.affectedRows === 0)
    throw new NotFoundError("Order not found");

  res.status(200).json({ message: "Delete order successful" });
};

const getPaymentStatus = async (req, res) => {
  const { orderId } = req.order;

  const order = await orderService.getPaymentStatus(orderId);
  return res.status(200).json({ ...order });
};

export default {
  getAllOrders: asyncHandler(getAllOrders),
  getOrdersByUserId: asyncHandler(getOrdersByUserId),
  getOrderItemsByOrderId: asyncHandler(getOrderItemsByOrderId),
  createOrder: asyncHandler(createOrder),
  updateOrderStatus: asyncHandler(updateOrderStatus),
  cancelOrder: asyncHandler(cancelOrder),
  deleteOrder: asyncHandler(deleteOrder),
  getStatusOverview: asyncHandler(getStatusOverview),
  getStatusRevenue: asyncHandler(getStatusRevenue),
  getPaymentStatus: asyncHandler(getPaymentStatus),
};

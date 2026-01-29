import express from "express";
const router = express.Router();

import {
  requireAuth,
  authorizeOrderAccess,
  optionalAuth,
} from "../middlewares/auth.middleware.js";

import userMiddleware from "../middlewares/user.middleware.js";
import orderController from "../controllers/order.controller.js";
import { resolveCart } from "../middlewares/cart.middleware.js";
import { asyncHandler } from "../errors/errorHandler.js";

// Xóa order dành cho admin
router.delete(
  "/:orderId",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.deleteOrder,
);

// Hủy order dành cho user và khách
router.put(
  "/:orderId/cancel",
  optionalAuth,
  authorizeOrderAccess,
  orderController.cancelOrder,
);

// Cập nhật trạng thái order dành cho admin
router.put(
  "/:orderId/status",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.updateOrderStatus,
);

// Tạo order dành cho user
router.post("/user/cod", requireAuth, resolveCart, orderController.createOrder);

// Tạo order dành cho khách
router.post(
  "/guest/cod",
  optionalAuth,
  resolveCart,
  orderController.createOrder,
);

// Xem trạng thái order của hôm nay so với hôm qua
router.get(
  "/stats/overviewCount",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.getStatusOverview,
);

router.get(
  "/stats/overviewRevenue",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.getStatusRevenue,
);

// Xem chi tiết item bên trong orderid có thể là khách, user, admin
router.get(
  "/:orderId/detail",
  optionalAuth,
  authorizeOrderAccess,
  orderController.getOrderItemsByOrderId,
);

// Xem tất cả order của chính bản thân dành cho user
router.get(
  "/user/my-orders",
  requireAuth,
  asyncHandler(orderController.getOrdersByUserId),
);

// Xem tất cả order của user đó dành cho admin
router.get(
  "/user/:userId",
  requireAuth,
  userMiddleware.checkAdmin,
  asyncHandler(orderController.getOrdersByUserId),
);
router.get(
  "/",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.getAllOrders,
);

export default router;

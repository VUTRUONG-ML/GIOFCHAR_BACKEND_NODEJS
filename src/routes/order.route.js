const express = require("express");
const router = express.Router();

const {
  requireAuth,
  authorizeOrderAccess,
  optionalAuth,
} = require("../middlewares/auth.middleware");

const userMiddleware = require("../middlewares/user.middleware");
const cartMiddleware = require("../middlewares/cart.middleware");
const orderController = require("../controllers/order.controller");
const {
  checkOrderExists,
  checkOrderByOrderCode,
} = require("../middlewares/order.middleware");

// Xóa order dành cho admin
router.delete(
  "/:orderId",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.deleteOrder
);

// Hủy order dành cho user và khách
router.put(
  "/:orderId/cancel",
  optionalAuth,
  authorizeOrderAccess,
  checkOrderExists,
  orderController.cancelOrder
);

// Cập nhật trạng thái order dành cho admin
router.put(
  "/:orderId/status",
  requireAuth,
  userMiddleware.checkAdmin,
  checkOrderExists,
  orderController.updateOrderStatus
);

// Tạo order dành cho user
router.post(
  "/user/cod",
  requireAuth,
  cartMiddleware.resolveCart,
  orderController.createOrder
);

// Tạo order dành cho khách
router.post(
  "/guest/cod",
  optionalAuth,
  cartMiddleware.resolveCart,
  orderController.createOrder
);

// Xem trạng thái order của hôm nay so với hôm qua
router.get(
  "/stats/overviewCount",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.getStatusOverview
);

router.get(
  "/stats/overviewRevenue",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.getStatusRevenue
);

// Xem chi tiết item bên trong orderid có thể là khách, user, admin
router.get(
  "/:orderId/detail",
  optionalAuth,
  authorizeOrderAccess,
  orderController.getOrderItemsByOrderId
);
router.get(
  "/payment-status/by-code/:orderCode",
  checkOrderByOrderCode,
  optionalAuth,
  authorizeOrderAccess,
  orderController.getPaymentStatus
);
// Xem tất cả order của chính bản thân dành cho user
router.get("/user/my-orders", requireAuth, orderController.getOrdersByUserId);

// Xem tất cả order của user đó dành cho admin
router.get(
  "/user/:userId",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.getOrdersByUserId
);
router.get(
  "/",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.getAllOrders
);

module.exports = router;

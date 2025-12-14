const express = require("express");
const router = express.Router();

const {
  requireAuth,
  authorizeOrderAccess,
} = require("../middlewares/auth.middleware");

const userMiddleware = require("../middlewares/user.middleware");
const cartMiddleware = require("../middlewares/cart.middleware");
const orderController = require("../controllers/order.controller");

router.delete(
  "/:orderId",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.deleteOrder
);

router.put(
  "/:orderId/cancel",
  requireAuth,
  authorizeOrderAccess,
  orderController.cancelOrder
);
router.put(
  "/:orderId/status",
  requireAuth,
  userMiddleware.checkAdmin,
  orderController.updateOrderStatus
);
router.post(
  "/cod",
  requireAuth,
  cartMiddleware.resolveCart,
  orderController.createOrder
);
router.get(
  "/:orderId/detail",
  requireAuth,
  authorizeOrderAccess,
  orderController.getOrderItemsByOrderId
);
router.get("/user/my-orders", requireAuth, orderController.getOrdersByUserId);
router.get(
  "/user/:userId",
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

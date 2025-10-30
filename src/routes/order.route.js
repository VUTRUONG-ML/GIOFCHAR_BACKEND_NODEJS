const express = require("express");
const router = express.Router();

const {
  verifyToken,
  authorizeOrderAccess,
} = require("../middlewares/auth.middleware");

const userMiddleware = require("../middlewares/user.middleware");
const cartMiddleware = require("../middlewares/cart.middleware");
const orderController = require("../controllers/order.controller");

router.delete(
  "/:orderId",
  verifyToken,
  userMiddleware.checkAdmin,
  orderController.deleteOrder
);

router.put(
  "/:orderId/cancel",
  verifyToken,
  authorizeOrderAccess,
  orderController.cancelOrder
);
router.put(
  "/:orderId/status",
  verifyToken,
  userMiddleware.checkAdmin,
  orderController.updateOrderStatus
);
router.post(
  "/cod",
  verifyToken,
  cartMiddleware.ensureCart,
  orderController.createOrder
);
router.get(
  "/:orderId/items",
  verifyToken,
  authorizeOrderAccess,
  orderController.getOrderItemsByOrderId
);
router.get("/user/my-orders", verifyToken, orderController.getOrdersByUserId);
router.get(
  "/user/:userId",
  userMiddleware.checkAdmin,
  orderController.getOrdersByUserId
);
router.get(
  "/",
  verifyToken,
  userMiddleware.checkAdmin,
  orderController.getAllOrders
);

module.exports = router;

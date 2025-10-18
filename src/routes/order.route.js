const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const userMiddleware = require("../middlewares/user.middleware");
const cartMiddleware = require("../middlewares/cart.middleware");

router.delete("/:orderId", orderController.deleteOrder);
router.put("/:orderId/cancel", orderController.cancelOrder);
router.put(
  "/:orderId/status",
  userMiddleware.checkAdmin,
  orderController.updateOrderStatus
);
router.post(
  "/my/:userId",
  cartMiddleware.ensureCart,
  orderController.createOrder
);
router.get("/:orderId/items", orderController.getOrderItemsByOrderId);
router.get(
  "/user/my-orders/:userId",
  userMiddleware.checkSelfOrAdmin,
  orderController.getOrdersByUserId
);
router.get("/", userMiddleware.checkAdmin, orderController.getAllOrders);

module.exports = router;

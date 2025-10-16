const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const userMiddleware = require("../middlewares/user.middleware");

router.get(
  "/user/:userId",
  userMiddleware.checkSelfOrAdmin,
  orderController.getOrdersByUserId
);
router.get("/", userMiddleware.checkAdmin, orderController.getAllOrders);

module.exports = router;

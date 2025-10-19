const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const userMiddleware = require("../middlewares/user.middleware");
const orderMiddleware = require("../middlewares/order.middleware");

router.delete(
  "/:paymentId",
  userMiddleware.checkAdmin,
  paymentController.deletePayment
);
router.put(
  "/:paymentId",
  userMiddleware.checkAdmin,
  paymentController.updatePayment
);
router.post(
  "/",
  userMiddleware.checkAdmin,
  orderMiddleware.checkOrderExists,
  paymentController.createPayment
);
router.get(
  "/:paymentId",
  userMiddleware.checkAdmin,
  paymentController.getPaymentById
);
router.get("/", userMiddleware.checkAdmin, paymentController.getAllPayments);

module.exports = router;

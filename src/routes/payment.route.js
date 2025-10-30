const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const userMiddleware = require("../middlewares/user.middleware");
const orderMiddleware = require("../middlewares/order.middleware");

router.delete(
  "/:paymentId",
  verifyToken,
  userMiddleware.checkAdmin,
  paymentController.deletePayment
);
router.put(
  "/:paymentId",
  verifyToken,
  userMiddleware.checkAdmin,
  paymentController.updatePayment
);
router.post(
  "/",
  verifyToken,
  userMiddleware.checkAdmin,
  orderMiddleware.checkOrderExists,
  paymentController.createPayment
);
router.get(
  "/:paymentId",
  verifyToken,
  userMiddleware.checkAdmin,
  paymentController.getPaymentById
);
router.get(
  "/",
  verifyToken,
  userMiddleware.checkAdmin,
  paymentController.getAllPayments
);

module.exports = router;

const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const userMiddleware = require("../middlewares/user.middleware");
const orderMiddleware = require("../middlewares/order.middleware");

router.delete(
  "/:paymentId",
  requireAuth,
  userMiddleware.checkAdmin,
  paymentController.deletePayment
);
router.put(
  "/:paymentId",
  requireAuth,
  userMiddleware.checkAdmin,
  paymentController.updatePayment
);
router.post(
  "/",
  requireAuth,
  userMiddleware.checkAdmin,
  orderMiddleware.checkOrderExists,
  paymentController.createPayment
);
router.get(
  "/:paymentId",
  requireAuth,
  userMiddleware.checkAdmin,
  paymentController.getPaymentById
);
router.get(
  "/",
  requireAuth,
  userMiddleware.checkAdmin,
  paymentController.getAllPayments
);

module.exports = router;

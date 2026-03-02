import express from "express";
const router = express.Router();

import paymentController from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

import { checkAdmin } from "../middlewares/user.middleware.js";
import { checkOrderExists } from "../middlewares/order.middleware.js";
import { asyncHandler } from "../errors/errorHandler.js";
import {
  checkVnpayOrder,
  verifyVnpaySignature,
} from "../middlewares/payment.middleware.js";
router.delete(
  "/:paymentId",
  requireAuth,
  checkAdmin,
  paymentController.deletePayment,
);
router.put(
  "/:paymentId",
  requireAuth,
  checkAdmin,
  paymentController.updatePayment,
);
router.post(
  "/",
  requireAuth,
  checkAdmin,
  checkOrderExists,
  paymentController.createPayment,
);

router.get(
  "/vnpay/ipn",
  verifyVnpaySignature,
  asyncHandler(checkVnpayOrder),
  asyncHandler(paymentController.handleIpn),
);

router.get(
  "/:paymentId",
  requireAuth,
  checkAdmin,
  paymentController.getPaymentById,
);
router.get("/", requireAuth, checkAdmin, paymentController.getAllPayments);

export default router;

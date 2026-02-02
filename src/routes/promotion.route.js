import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";
import { asyncHandler } from "../errors/errorHandler.js";
import {
  createPromotionController,
  deletePromotionController,
  getPromotionsController,
  updatedActiveController,
  updatePromotionController,
} from "../controllers/promotion.controller.js";
const router = express.Router();
router.delete(
  "/:promotionId",
  requireAuth,
  checkAdmin,
  asyncHandler(deletePromotionController),
);

router.put(
  "/:promotionId",
  requireAuth,
  checkAdmin,
  asyncHandler(updatePromotionController),
);
router.patch(
  "/:promotionId/active",
  requireAuth,
  checkAdmin,
  asyncHandler(updatedActiveController),
);
router.post(
  "/",
  requireAuth,
  checkAdmin,
  asyncHandler(createPromotionController),
);
router.get("/", requireAuth, checkAdmin, asyncHandler(getPromotionsController));

export default router;

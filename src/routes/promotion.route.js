import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";
import { asyncHandler } from "../errors/errorHandler.js";
import {
  createPromotionController,
  getPromotionsController,
  updatePromotionController,
} from "../controllers/promotion.controller.js";
const router = express.Router();

router.put(
  "/:promotionId",
  requireAuth,
  checkAdmin,
  asyncHandler(updatePromotionController),
);
router.post("/", requireAuth, checkAdmin, createPromotionController);
router.get("/", requireAuth, checkAdmin, asyncHandler(getPromotionsController));

export default router;

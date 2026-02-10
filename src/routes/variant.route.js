import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";
import { asyncHandler } from "../errors/errorHandler.js";
import {
  deleteVariantController,
  updateVariantController,
} from "../controllers/variant.controller.js";

const router = express.Router();

router.delete(
  "/:variantId",
  requireAuth,
  checkAdmin,
  asyncHandler(deleteVariantController),
);

router.put(
  "/:variantId",
  requireAuth,
  checkAdmin,
  asyncHandler(updateVariantController),
);

export default router;

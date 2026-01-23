import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";
import { asyncHandler } from "../errors/errorHandler.js";
import { updateVariantController } from "../controllers/variant.controller.js";

const router = express.Router();

router.patch(
  "/:variantId",
  requireAuth,
  checkAdmin,
  asyncHandler(updateVariantController),
);

export default router;

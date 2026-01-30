import express from "express";
const router = express.Router();

import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";
import { checkFoodExists } from "../middlewares/checkFood.js";
import { asyncHandler } from "../errors/errorHandler.js";

import {
  clearCartController,
  deleteCartItemController,
  addFoodToCartController,
  getAllCartItemsController,
  getAllCartsController,
} from "../controllers/cart.controller.js";

router.delete("/", optionalAuth, asyncHandler(clearCartController));
router.delete(
  "/:cartItemId",
  optionalAuth,
  asyncHandler(deleteCartItemController),
);
router.post("/cartItem", optionalAuth, asyncHandler(addFoodToCartController));
router.get("/my-cartItems", optionalAuth, getAllCartItemsController);
router.get("/", requireAuth, checkAdmin, getAllCartsController);

export default router;

import express from "express";
const router = express.Router();

import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";

import {
  clearCartController,
  deleteCartItemController,
  addFoodToCartController,
  getAllCartItemsController,
  getAllCartsController,
} from "../controllers/cart.controller.js";

router.delete("/", optionalAuth, clearCartController);
router.delete("/:cartItemId", optionalAuth, deleteCartItemController);
router.post("/cartItem", optionalAuth, addFoodToCartController);
router.get("/my-cartItems", optionalAuth, getAllCartItemsController);
router.get("/", requireAuth, checkAdmin, getAllCartsController);

export default router;

const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart.controller");
const {
  resolveCart,
  itemBelongOwn,
} = require("../middlewares/cart.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");
const checkFood = require("../middlewares/checkFood");

router.delete("/", requireAuth, resolveCart, cartController.clearCart);
router.delete(
  "/:cartItemId",
  requireAuth,
  resolveCart,
  itemBelongOwn,
  cartController.deleteCartItem
);
router.post(
  "/cartItem",
  requireAuth,
  resolveCart,
  checkFood,
  cartController.addFoodToCart
);
router.get(
  "/my-cartItems",
  requireAuth,
  resolveCart,
  cartController.getAllCartItems
);
router.get("/", requireAuth, checkAdmin, cartController.getAllCarts);

module.exports = router;

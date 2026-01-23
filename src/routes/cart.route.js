const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart.controller");
const {
  resolveCart,
  itemBelongOwn,
} = require("../middlewares/cart.middleware");
const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");
const { checkFoodExists } = require("../middlewares/checkFood");

router.delete("/", optionalAuth, resolveCart, cartController.clearCart);
router.delete(
  "/:cartItemId",
  optionalAuth,
  resolveCart,
  itemBelongOwn,
  cartController.deleteCartItem,
);
router.post(
  "/cartItem",
  optionalAuth,
  resolveCart,
  checkFoodExists,
  cartController.addFoodToCart,
);
router.get(
  "/my-cartItems",
  optionalAuth,
  resolveCart,
  cartController.getAllCartItems,
);
router.get("/", requireAuth, checkAdmin, cartController.getAllCarts);

module.exports = router;

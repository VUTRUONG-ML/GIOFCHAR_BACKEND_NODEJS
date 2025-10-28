const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart.controller");
const { ensureCart } = require("../middlewares/cart.middleware");
const { verifyToken } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");
const checkFood = require("../middlewares/checkFood");

router.delete("/", verifyToken, ensureCart, cartController.clearCart);
router.delete(
  "/:cartItemId",
  verifyToken,
  ensureCart,
  cartController.deleteCartItem
);
router.post(
  "/cartItem",
  verifyToken,
  ensureCart,
  checkFood,
  cartController.addFoodToCart
);
router.get(
  "/my-cartItems",
  verifyToken,
  ensureCart,
  cartController.getAllCartItems
);
router.get("/", verifyToken, checkAdmin, cartController.getAllCarts);

module.exports = router;

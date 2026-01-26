const express = require("express");
const router = express.Router();

const {
  resolveCart,
  itemBelongOwn,
} = require("../middlewares/cart.middleware");
const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");
const { checkFoodExists } = require("../middlewares/checkFood");
const {
  clearCartController,
  deleteCartItemController,
  addFoodToCartController,
  getAllCartItemsController,
  getAllCartsController,
} = require("../controllers/cart.controller");

router.delete("/", optionalAuth, resolveCart, clearCartController);
router.delete(
  "/:cartItemId",
  optionalAuth,
  resolveCart,
  itemBelongOwn,
  deleteCartItemController,
);
router.post(
  "/cartItem",
  optionalAuth,
  resolveCart,
  checkFoodExists,
  addFoodToCartController,
);
router.get("/my-cartItems", optionalAuth, getAllCartItemsController);
router.get("/", requireAuth, checkAdmin, getAllCartsController);

module.exports = router;

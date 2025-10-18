const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart.controller");
const { ensureCart } = require("../middlewares/cart.middleware");
const checkFood = require("../middlewares/checkFood");

router.delete("/:userId", ensureCart, cartController.clearCart);
router.delete("/:cartItemId", cartController.deleteCartItem);
router.post("/:userId", ensureCart, checkFood, cartController.addFoodToCart);
router.get("/my-cartItems/:userId", ensureCart, cartController.getAllCartItems);
router.get("/", cartController.getAllCarts);

module.exports = router;

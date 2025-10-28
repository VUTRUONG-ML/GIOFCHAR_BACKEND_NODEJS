const cartService = require("../services/cart.service");
const cartItemService = require("../services/cartItem.service");

const getAllCarts = async (req, res) => {
  try {
    const carts = await cartService.getAllCarts();
    res.status(200).json({ carts: carts });
  } catch (err) {
    const status = err.statusCode || 500;
    const message = status === 500 ? "Internal server error" : err.message;
    return res.status(status).json({ message });
  }
};

const getAllCartItems = async (req, res) => {
  const cartId = req.cartId;
  try {
    const cartItems = await cartItemService.getCartItemsByCartId(cartId);
    if (!cartItems.length)
      return res.status(200).json({ message: "Empty carts", cartItems });

    res.status(200).json(cartItems);
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const addFoodToCart = async (req, res) => {
  const cartId = req.cartId;
  const { foodId, quantity } = req.body;

  try {
    const result = await cartService.addToCart(foodId, quantity, cartId);

    res.status(200).json(result);
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR addFoodToCart", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteCartItem = async (req, res) => {
  const cartId = req.cartId;
  const cartItemId = req.params.cartItemId;

  try {
    const result = await cartItemService.deleteCartItem(cartItemId, cartId);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Cart item not found" });

    res.status(200).json({ message: "Delete cart item successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR deleteCartItem", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const clearCart = async (req, res) => {
  const cartId = req.cartId;
  try {
    const result = await cartService.clearCart(cartId);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Cart not found" });

    res.status(200).json({ message: "Clear cart successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR clearCart-", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllCarts,
  getAllCartItems,
  addFoodToCart,
  deleteCartItem,
  clearCart,
};

import cartService from "../services/cart.service.js";
import cartItemService from "../services/cartItem.service.js";
import pool from "../config/db.js";
import { ConflictError } from "../errors/AppError.js";
export const getAllCartsController = async (req, res) => {
  try {
    const carts = await cartService.getAllCarts();
    res.status(200).json({ carts: carts });
  } catch (err) {
    console.log(err);
    const status = err.statusCode || 500;
    const message = status === 500 ? "Internal server error" : err.message;
    console.log(">>>>> CONTROLLER ERROR", message);
    res.status(status).json({ message: message });
  }
};

export const getAllCartItemsController = async (req, res) => {
  console.log(">>> user:", req.user);
  try {
    const cartItems = await cartService.withCart(
      req.user,
      async ({ cartId, conn }) => {
        return cartItemService.getCartItemsByCartId(cartId, conn);
      },
    );
    if (!cartItems.length)
      return res.status(200).json({ message: "Empty carts", cartItems });

    res.status(200).json({ message: "Success", cartItems });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const addFoodToCartController = async (req, res) => {
  const { variantId, quantity } = req.body;
  try {
    const result = await cartService.withCart(
      req.user,
      async ({ cartId, conn }) => {
        return await cartService.addToCart(variantId, quantity, cartId, conn);
      },
    );

    const { message, ...otherInf } = result;
    res.status(200).json({
      message: message,
      cartItem: {
        ...otherInf,
      },
    });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR addFoodToCart", err.message);
    throw err;
  }
};

export const deleteCartItemController = async (req, res) => {
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

export const clearCartController = async (req, res) => {
  const cartId = req.cartId;
  try {
    const result = await cartService.clearCart(cartId, pool);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Cart not found" });

    res.status(200).json({ message: "Clear cart successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR clearCart-", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

import cartService from "../services/cart.service.js";
import cartItemService from "../services/cartItem.service.js";
import pool from "../config/db.js";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
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
};

export const deleteCartItemController = async (req, res) => {
  const user = req.user;
  const cartItemId = req.params.cartItemId;

  const result = await cartService.withCart(
    { ...user, cartItemId },
    async ({ cartId, conn }) => {
      return await cartItemService.deleteCartItem(cartItemId, cartId, conn);
    },
  );

  return res.status(200).json({ message: "Delete cart item successful" });
};

export const clearCartController = async (req, res) => {
  const result = cartService.withCart(req.user, async ({ cartId, conn }) => {
    return await cartService.clearCart(cartId, conn);
  });

  res.status(200).json({ message: "Clear cart successful" });
};

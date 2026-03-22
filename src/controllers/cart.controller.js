import cartService from "../services/cart.service.js";
import cartItemService from "../services/cartItem.service.js";
import pool from "../config/db.js";

import { asyncHandler } from "../errors/errorHandler.js";

export const getAllCartsController = asyncHandler(async (req, res) => {
  const carts = await cartService.getAllCarts();
  return res.status(200).json({ carts: carts });
});

export const getAllCartItemsController = asyncHandler(async (req, res) => {
  const cartItems = await cartService.withCart(
    req.user,
    async ({ cartId, conn }) => {
      return cartItemService.getCartItemsByCartId(cartId, conn);
    },
  );
  if (!cartItems.length)
    return res.status(200).json({ message: "Empty carts", cartItems });

  return res.status(200).json({ message: "Success", cartItems });
});

export const addFoodToCartController = asyncHandler(async (req, res) => {
  const { variantId, quantity } = req.body;

  const result = await cartService.withCart(
    req.user,
    async ({ cartId, conn }) => {
      return await cartService.addToCart(variantId, quantity, cartId, conn);
    },
  );

  const { message, ...otherInf } = result;
  return res.status(200).json({
    message: message,
    cartItem: {
      ...otherInf,
    },
  });
});

export const deleteCartItemController = asyncHandler(async (req, res) => {
  const user = req.user;
  const cartItemId = req.params.cartItemId;

  const result = await cartService.withCart(
    { ...user, cartItemId },
    async ({ cartId, conn }) => {
      return await cartItemService.deleteCartItem(cartItemId, cartId, conn);
    },
  );

  return res.status(200).json({
    message: "Delete cart item successful",
    cartVersion: result.cartVersion,
  });
});

export const clearCartController = asyncHandler(async (req, res) => {
  const result = await cartService.withCart(
    req.user,
    async ({ cartId, conn }) => {
      return await cartService.clearCart(cartId, conn);
    },
  );

  return res.status(200).json({ message: "Clear cart successful" });
});

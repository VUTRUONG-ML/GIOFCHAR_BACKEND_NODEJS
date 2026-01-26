import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import cartItemService from "../services/cartItem.service.js";

export const resolveCart = async (req, res, next) => {
  try {
    const { guestToken: incomingGuestToken, userId } = req.user ?? {};
    let cart;
    let guestToken = incomingGuestToken;
    if (userId) {
      cart = await cartService.ensureCart({ userId });
    } else {
      if (!guestToken) {
        guestToken = uuidv4();
        res.setHeader("x-guest-token", guestToken);
      }
      cart = await cartService.ensureCart({ guestToken });
    }

    req.cartId = cart.id;
    next();
  } catch (error) {
    console.log(">>>>> MIDDLEWARE ERROR", error.message);
    return res
      .status(500)
      .json({ message: "Failed to get or create cart", error: error.message });
  }
};

export const itemBelongOwn = async (req, res, next) => {
  const cartId = req.cartId;
  const { cartItemId } = req.params;
  try {
    const cartItem = await cartItemService.findCartItem(
      { cartId, cartItemId },
      pool,
    );
    if (!cartItem) {
      return res.status(403).json({ message: "You do not have access" });
    }
    next();
  } catch (error) {
    console.log(">>>>> MIDDLEWARE ERROR itemBelongOwn", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

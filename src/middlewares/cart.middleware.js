import { v4 as uuidv4 } from "uuid";
import cartService from "../services/cart.service.js";

export const resolveCart = async (req, res, next) => {
  try {
    let cart;

    if (req.user) {
      const userId = req.user.userId;
      console.log("vao userid", userId);
      cart = await cartService.ensureCart({ userId });
    } else {
      console.log("vao guest");
      let guestToken = req.headers["x-guest-token"];
      if (!guestToken) {
        guestToken = uuidv4();
        res.setHeader("X-Guest-Token", guestToken);
      }
      cart = await cartService.ensureCart({ guestToken });
    }

    req.cartId = cart.id;
    next();
  } catch (error) {
    console.log(">>>>> MIDDLEWARE ERROR", error.message);
    res
      .status(500)
      .json({ message: "Failed to get or create cart", error: error.message });
  }
};

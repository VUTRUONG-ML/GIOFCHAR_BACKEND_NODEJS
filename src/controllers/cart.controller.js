import cartService from "../services/cart.service.js";
import cartItemService from "../services/cartItem.service.js";
import pool from "../config/db.js";
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
  const cartId = req.cartId;
  const { foodId, quantity } = req.body;
  const food = req.food;
  try {
    const result = await cartService.addToCart(foodId, quantity, cartId);

    res.status(200).json({
      message: result.message,
      cartItem: {
        cartItemId: result.cartItemId,
        foodId: food.foodId,
        foodName: food.foodName,
        image: food.image,
        price: food.price,
        originalPrice: food.originalPrice,
        discount: food.discount,
        quantity: result.quantity,
      },
    });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR addFoodToCart", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
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

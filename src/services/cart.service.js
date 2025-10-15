const pool = require("../config/db");
const cartItemService = require("./cartItem.service");

const getCartByUserId = async (userId) => {
  try {
    const [carts] = await pool.execute("SELECT * FROM carts WHERE userID = ?", [
      userId,
    ]);

    return carts;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const createCart = async (userId) => {
  try {
    const [result] = await pool.execute(
      "INSERT INTO carts (userID) VALUES (?)",
      [userId]
    );
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const addToCart = async (foodId, quantity, cartId) => {
  // Kiểm tra foodId đã có trong cartId chưa
  try {
    const cartItems = await cartItemService.findCartItem(cartId, foodId);
    if (!cartItems) {
      await cartItemService.insertCartItem(cartId, foodId, quantity);
      return {
        message: "Added new item to cart",
        cartId: cartId,
        foodId,
        quantity,
      };
    } else {
      await cartItemService.updateCartItemQuantity(cartItems.id, quantity);
      return {
        message: "Updated quantity item successful",
        cartId: cartId,
        foodId,
        quantity,
      };
    }
  } catch (err) {
    console.log(">>>>> SERVICE ERROR addToCart:", err.message);
    throw err;
  }
};

const clearCart = async (cartId) => {
  try {
    const [result] = await pool.execute("DELETE FROM carts WHERE id = ?", [
      cartId,
    ]);

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getCartByUserId,
  createCart,
  addToCart,
  clearCart,
};

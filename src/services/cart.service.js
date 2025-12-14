const pool = require("../config/db");
const { validateCartOwner } = require("./cart.validators");
const cartItemService = require("./cartItem.service");

const getAllCarts = async () => {
  try {
    const [carts] = await pool.execute("SELECT * FROM carts");
    return carts;
  } catch (err) {
    throw err;
  }
};

const getCart = async ({ userId, guestToken }) => {
  validateCartOwner({ userId, guestToken });

  const field = userId ? "userID" : "guestToken";
  const value = userId ?? guestToken;
  try {
    const [carts] = await pool.execute(
      `SELECT * FROM carts WHERE ${field} = ?`,
      [value]
    );

    return carts.length > 0 ? carts[0] : null;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const createCart = async ({ userId, guestToken }) => {
  validateCartOwner({ userId, guestToken });

  const field = userId ? "userID" : "guestToken";
  const value = userId ?? guestToken;

  try {
    const [result] = await pool.execute(
      `INSERT INTO carts (${field}) VALUES (?)`,
      [value]
    );

    const [rows] = await pool.execute("SELECT * FROM carts WHERE id = ?", [
      result.insertId,
    ]);

    return rows.length > 0 ? rows[0] : null;
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

const ensureCart = async ({ userId, guestToken }) => {
  console.log("check service", userId);
  validateCartOwner({ userId, guestToken });
  try {
    let cart = await getCart({ userId, guestToken });
    if (!cart) cart = await createCart({ userId, guestToken });
    return cart;
  } catch (error) {
    console.log(">>>> SERVICE ERROR", error.message);
    throw error;
  }
};

module.exports = {
  getAllCarts,
  getCart,
  createCart,
  addToCart,
  clearCart,
  ensureCart,
};

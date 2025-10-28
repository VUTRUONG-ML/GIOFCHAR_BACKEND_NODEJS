const pool = require("../config/db");

// -> người dùng userID sẽ có cartID thêm vào giỏ hàng foodID -> mình tìm cartItemID nào mà có cartID - foodID -> nếu có update quantity - nếu không insert vào cartItem
const getCartItemsByCartId = async (cartId) => {
  // trả về toàn bộ food bên trong một giỏ hàng
  try {
    const [cartItems] = await pool.execute(
      `SELECT 
            ci.id AS cartItemsId, 
            f.id  AS foodId,
            f.foodName,
            f.image,
            f.price,
            ci.quantity,
            ci.cartID AS cartID
        FROM cart_items ci 
        JOIN foods f ON ci.foodID = f.id 
        WHERE ci.cartID = ?`,
      [cartId]
    );
    return cartItems;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const findCartItem = async (cartId, foodId) => {
  // tìm cartItem có cartID và foodID
  try {
    const [result] = await pool.execute(
      `
        SELECT *
        FROM cart_items ci 
        WHERE ci.cartID = ? AND ci.foodID = ?`,
      [cartId, foodId]
    );
    return result.length ? result[0] : null;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR findCartItem", err.message);
    throw new Error("Database query failed while checking cart item");
  }
};

const updateCartItemQuantity = async (cartItemId, quantity) => {
  // Nếu món ăn tồn tại trong cart
  try {
    const [result] = await pool.execute(
      "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
      [quantity, cartItemId]
    );
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR updateCartItem", err.message);
    throw err;
  }
};

// -> Lấy cartID của người dùng hiện tại -> thêm vào food cho cartID đó thông qua bảng cart_items
const insertCartItem = async (cartId, foodId, quantity) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO cart_items (cartID, foodID, quantity)
        VALUES (?, ?, ?)`,
      [cartId, foodId, quantity]
    );
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR insertCartItem", err.message);
    throw err;
  }
};

const deleteCartItem = async (cartItemId, cartId) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM cart_items WHERE id = ? AND cartID = ?",
      [cartItemId, cartId]
    );
    return result;
  } catch (err) {
    throw err;
  }
};
module.exports = {
  getCartItemsByCartId,
  findCartItem,
  updateCartItemQuantity,
  insertCartItem,
  deleteCartItem,
};

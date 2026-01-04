const pool = require("../config/db");

// -> người dùng userID sẽ có cartID thêm vào giỏ hàng foodID -> mình tìm cartItemID nào mà có cartID - foodID -> nếu có update quantity - nếu không insert vào cartItem
const getCartItemsByCartId = async (cartId, conn) => {
  // trả về toàn bộ food bên trong một giỏ hàng
  try {
    const [cartItems] = await conn.execute(
      `SELECT 
          ci.id AS cartItemId, 
          f.id  AS foodId,
          f.foodName,
          f.image,
          f.price,
          f.originalPrice,
          f.discount,
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

const findCartItem = async ({ cartId, foodId, cartItemId }, conn) => {
  // tìm cartItem có cartID và foodID
  const field = cartItemId ? "ci.id" : "ci.foodID";
  const value = cartItemId ?? foodId;
  try {
    const [result] = await conn.execute(
      `
        SELECT *
        FROM cart_items ci 
        WHERE ci.cartID = ? AND ${field} = ?`,
      [cartId, value]
    );
    return result.length ? result[0] : null;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR findCartItem", err.message);
    throw new Error("Database query failed while checking cart item");
  }
};

const updateCartItemQuantity = async (cartItemId, delta, conn) => {
  // Nếu món ăn tồn tại trong cart
  try {
    const [result] = await conn.execute(
      "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
      [delta, cartItemId]
    );
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR updateCartItem", err.message);
    throw err;
  }
};

// -> Lấy cartID của người dùng hiện tại -> thêm vào food cho cartID đó thông qua bảng cart_items
const insertCartItem = async (cartId, foodId, quantity, conn) => {
  try {
    const [result] = await conn.execute(
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

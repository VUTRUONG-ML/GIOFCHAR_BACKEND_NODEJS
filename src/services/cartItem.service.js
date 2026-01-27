import pool from "../config/db.js";
import { ConflictError } from "../errors/AppError.js";
import { groupVariant } from "../utils/variant.js";

// -> người dùng userID sẽ có cartID thêm vào giỏ hàng foodID -> mình tìm cartItemID nào mà có cartID - foodID -> nếu có update quantity - nếu không insert vào cartItem
const getCartItemsByCartId = async (cartId, conn) => {
  // trả về toàn bộ food bên trong một giỏ hàng
  try {
    const [rows] = await conn.execute(
      `SELECT 
        ci.id AS cartItemId, 
        f.id  AS foodId,
        f.foodName,
        f.image,
        
        fv.id as variantId,
        fv.weight_gram,
        fv.stock as inStock,
        fv.originalPrice,
        
        p.id as promotionId,
        p.type as typePromotion,
        p.value as valuePromotion, 
        
        ci.quantity
      FROM cart_items ci 
      JOIN food_variants fv ON ci.food_variantID = fv.id 
      JOIN foods f ON fv.foodID = f.id
      LEFT JOIN promotion_targets pt ON pt.food_variantID = fv.id
      LEFT JOIN promotions p ON pt.promotionID = p.id 
          AND NOW() BETWEEN p.start_at AND p.end_at 
          AND p.isActive = TRUE
      WHERE ci.cartID = ?`,
      [cartId],
    );
    const cartItems = groupVariant(rows);
    return cartItems;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const findCartItem = async (
  { cartId, variantId, cartItemId },
  conn,
  forUpdate = false,
) => {
  // khi truyền conn thì chắc chắn là đang sử dụng transaction
  // tìm cartItem có cartID và variantId
  const field = cartItemId ? "ci.id" : "ci.food_variantID";
  const option = forUpdate && conn ? "FOR UPDATE" : "";
  const value = cartItemId ?? variantId;
  try {
    const [result] = await conn.execute(
      `
        SELECT *
        FROM cart_items ci 
        WHERE ci.cartID = ? AND ${field} = ?
        ${option}`,
      [cartId, value],
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
      [delta, cartItemId],
    );
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR updateCartItem", err.message);
    throw err;
  }
};

// -> Lấy cartID của người dùng hiện tại -> thêm vào food cho cartID đó thông qua bảng cart_items
const insertCartItem = async (cartId, variantId, quantity, conn) => {
  try {
    const [result] = await conn.execute(
      `INSERT INTO cart_items (cartID, food_variantID, quantity)
        VALUES (?, ?, ?)`,
      [cartId, variantId, quantity],
    );
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR insertCartItem", err.message);
    throw err;
  }
};

const deleteCartItem = async (cartItemId, cartId, conn = pool) => {
  try {
    const [result] = await conn.execute(
      "DELETE FROM cart_items WHERE id = ? AND cartID = ?",
      [cartItemId, cartId],
    );
    return result;
  } catch (err) {
    throw err;
  }
};
export default {
  getCartItemsByCartId,
  findCartItem,
  updateCartItemQuantity,
  insertCartItem,
  deleteCartItem,
};

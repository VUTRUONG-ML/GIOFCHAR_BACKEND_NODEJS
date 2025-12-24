const pool = require("../config/db");
const { validateOwner } = require("./validators");
const cartItemService = require("./cartItem.service");

const getAllCarts = async () => {
  try {
    const [carts] = await pool.execute("SELECT * FROM carts");
    return carts;
  } catch (err) {
    throw err;
  }
};

const getCart = async ({ userId, guestToken }, { conn, forUpdate = false }) => {
  validateOwner({ userId, guestToken });
  const isLock = forUpdate ? "FOR UPDATE" : "";
  const field = userId ? "userID" : "guestToken";
  const value = userId ?? guestToken;
  try {
    const [carts] = await conn.execute(
      `SELECT * FROM carts WHERE ${field} = ? ${isLock}`,
      [value]
    );

    return carts.length > 0 ? carts[0] : null;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const createCart = async ({ userId, guestToken }) => {
  validateOwner({ userId, guestToken });

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

const addToCart = async (foodId, delta, cartId) => {
  // Kiểm tra foodId đã có trong cartId chưa
  try {
    const cartItem = await cartItemService.findCartItem(
      { cartId, foodId },
      pool
    );
    if (!cartItem) {
      const result = await cartItemService.insertCartItem(
        cartId,
        foodId,
        delta,
        pool
      );
      return {
        message: "Added new item to cart",
        cartId: cartId,
        cartItemId: result.insertId,
        quantity: delta,
      };
    } else {
      const cartItemId = cartItem.id;
      const newQuantity = cartItem.quantity + delta;
      if (newQuantity <= 0) {
        await cartItemService.deleteCartItem(cartItemId, cartId);
        return {
          message: "Remove item from cart successful",
          cartId: cartId,
          cartItemId,
          quantity: 0,
        };
      }
      await cartItemService.updateCartItemQuantity(cartItem.id, delta, pool);
      return {
        message: "Updated quantity item successful",
        cartId: cartId,
        cartItemId,
        quantity: newQuantity,
      };
    }
  } catch (err) {
    console.log(">>>>> SERVICE ERROR addToCart:", err.message);
    throw err;
  }
};

const mergeGuestCartToUser = async ({ userId, guestToken }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const cartUser = await getCart(
      { userId },
      { conn: connection, forUpdate: true }
    );
    const cartGuest = await getCart(
      { guestToken },
      { conn: connection, forUpdate: true }
    );
    if (!cartGuest) {
      await connection.commit();
      return;
    }
    if (!cartUser) {
      // Trường hợp sau khi người dùng thêm giỏ hàng rồi đang nhập nhưng tài khoản chưa có giỏ hàng
      const [result] = await connection.execute(
        `UPDATE carts SET userID = ?, guestToken = NULL WHERE guestToken = ?`,
        [userId, guestToken]
      );
    } else {
      const guestItems = await cartItemService.getCartItemsByCartId(
        cartGuest.id,
        connection
      );
      for (const guestItem of guestItems) {
        //Kiểm tra trong cartUser đã có foodId này chưa
        const existed = await cartItemService.findCartItem(
          {
            cartId: cartUser.id,
            foodId: guestItem.foodId,
          },
          connection
        );
        if (existed) {
          // nếu có rồi
          await cartItemService.updateCartItemQuantity(
            existed.id,
            guestItem.quantity,
            connection
          );
        } else {
          //Nếu chưa có
          await cartItemService.insertCartItem(
            cartUser.id,
            guestItem.foodId,
            guestItem.quantity,
            connection
          );
        }
      }
      await clearCart(cartGuest.id, connection);
    }
    await connection.commit();
    console.log(">>>>> Merge cart success");
    return;
  } catch (error) {
    await connection.rollback();
    console.log(">>>>> SERVICE ERROR merge cart:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};

const clearCart = async (cartId, conn) => {
  try {
    const [result] = await conn.execute("DELETE FROM carts WHERE id = ?", [
      cartId,
    ]);

    return result;
  } catch (err) {
    throw err;
  }
};

const ensureCart = async ({ userId, guestToken }) => {
  validateOwner({ userId, guestToken });
  try {
    let cart = await getCart({ userId, guestToken }, { conn: pool });
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
  mergeGuestCartToUser,
};

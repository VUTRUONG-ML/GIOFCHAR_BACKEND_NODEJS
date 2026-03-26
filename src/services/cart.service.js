import pool from "../config/db.js";
import { validateOwner } from "./validators.js";
import cartItemService from "./cartItem.service.js";
import { getVariantById } from "./variant.service.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import logger from "../config/logger.js";
import { LOG_EVENTS } from "../constants/logEvents.js";

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
      [value],
    );

    return carts.length > 0 ? carts[0] : null;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const createCart = async ({ userId, guestToken }, conn = pool) => {
  validateOwner({ userId, guestToken });

  const field = userId ? "userID" : "guestToken";
  const value = userId ?? guestToken;

  try {
    const [result] = await conn.execute(
      `INSERT INTO carts (${field}) VALUES (?)`,
      [value],
    );

    const [rows] = await conn.execute("SELECT * FROM carts WHERE id = ?", [
      result.insertId,
    ]);

    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const addToCart = async (variantId, delta, cartId, connection) => {
  const objLog = {
    variantId,
    cartId,
    delta,
  };
  logger.debug("Start addToCart", objLog);
  // Trước khi update item trong cart thì update version cart
  const variant = await getVariantById(variantId, true, connection);
  if (!variant) {
    logger.warn(LOG_EVENTS.CART.ADD_ITEM_FAILED, {
      reason: "VARIANT_NOT_FOUND",
      ...objLog,
    });
    throw new NotFoundError("Food variant not found");
  }

  // Kiểm tra variantId đã có trong cartId chưa
  const cartItem = await cartItemService.findCartItem(
    { cartId, variantId },
    connection,
    true,
  );
  let result;
  if (!cartItem) {
    if (delta <= 0) {
      logger.warn(LOG_EVENTS.CART.ADD_ITEM_FAILED, {
        reason: "NEGATIVE_QUANTITY",
        ...objLog,
      });
      throw new BadRequestError("Item not found in cart");
    }

    const resInsert = await cartItemService.insertCartItem(
      cartId,
      variantId,
      delta,
      connection,
    );

    logger.info(LOG_EVENTS.CART.ADD_ITEM_SUCCESS, {
      ...objLog,
      action: "INSERT",
      quantity: delta,
    });

    result = {
      message: "Added new item to cart",
      cartId: cartId,
      cartItemId: resInsert.insertId,
      ...variant,
      quantity: delta,
    };
  } else {
    const cartItemId = cartItem.id;
    const newQuantity = cartItem.quantity + delta;
    if (newQuantity <= 0) {
      await cartItemService.deleteCartItem(cartItemId, cartId, connection);
      logger.info(LOG_EVENTS.CART.ADD_ITEM_SUCCESS, {
        ...objLog,
        action: "REMOVE",
        quantity: 0,
      });
      result = {
        message: "Remove item from cart successful",
        cartId: cartId,
        cartItemId,
        ...variant,
        quantity: 0,
      };
    } else {
      await cartItemService.updateCartItemQuantity(
        cartItem.id,
        delta,
        connection,
      );
      logger.info(LOG_EVENTS.CART.ADD_ITEM_SUCCESS, {
        ...objLog,
        action: "UPDATE",
        quantity: newQuantity,
      });
      result = {
        message: "Updated quantity item successful",
        cartId: cartId,
        cartItemId,
        ...variant,
        quantity: newQuantity,
      };
    }
  }
  const cartVersion = await updateVersion(cartId, connection);
  return { ...result, cartVersion };
};

const mergeGuestCartToUser = async ({ userId, guestToken }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const cartUser = await getCart(
      { userId },
      { conn: connection, forUpdate: true },
    );
    const cartGuest = await getCart(
      { guestToken },
      { conn: connection, forUpdate: true },
    );
    if (!cartGuest) {
      await connection.commit();
      return;
    }
    if (!cartUser) {
      // Trường hợp sau khi người dùng thêm giỏ hàng rồi đang nhập nhưng tài khoản chưa có giỏ hàng
      const [result] = await connection.execute(
        `UPDATE carts SET userID = ?, guestToken = NULL WHERE guestToken = ?`,
        [userId, guestToken],
      );
    } else {
      const guestItems = await cartItemService.getCartItemsByCartId(
        cartGuest.id,
        connection,
      );
      for (const guestItem of guestItems) {
        //Kiểm tra trong cartUser đã có variant này chưa
        const existed = await cartItemService.findCartItem(
          {
            cartId: cartUser.id,
            variantId: guestItem.variantId,
          },
          connection,
        );
        if (existed) {
          // nếu có rồi
          await cartItemService.updateCartItemQuantity(
            existed.id,
            guestItem.quantity,
            connection,
          );
        } else {
          //Nếu chưa có
          await cartItemService.insertCartItem(
            cartUser.id,
            guestItem.variantId,
            guestItem.quantity,
            connection,
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

const clearCart = async (cartId, conn = pool) => {
  const [result] = await conn.execute("DELETE FROM carts WHERE id = ?", [
    cartId,
  ]);
  if (result.affectedRows === 0) {
    logger.warn("CART_CLEAR_FAILED", { reason: "CART_NOT_FOUND", cartId });
    throw new NotFoundError("Cart not found");
  }
  return true;
};

const ensureCart = async ({ userId, guestToken }, conn = pool) => {
  validateOwner({ userId, guestToken });
  try {
    let cart = await getCart({ userId, guestToken }, { conn, forUpdate: true });
    if (!cart) cart = await createCart({ userId, guestToken }, conn);
    return cart;
  } catch (error) {
    console.log(">>>> SERVICE ERROR", error.message);
    throw error;
  }
};

async function withCart(context, handler) {
  const { guestToken: incomingGuestToken, userId } = context ?? {};
  const conn = await pool.getConnection();

  let currentCartId = null; // Biến tạm để cứu hộ khi lỗi

  try {
    await conn.beginTransaction();

    let cart;
    let guestToken = incomingGuestToken;
    if (userId) {
      cart = await ensureCart({ userId }, conn);
    } else {
      cart = await ensureCart({ guestToken }, conn);
    }
    currentCartId = cart.id;
    logger.debug("Starting cart transaction", {
      cartId: currentCartId,
      incomingGuestToken,
      userId,
    });

    const result = await handler({
      cartId: cart.id,
      conn,
      cartVersion: cart.cartVersion,
    });

    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    err.context = {
      ...err.context,
      action: "CART_TRANSACTION",
      cartId: currentCartId, // để biết giỏ hàng nào bị lỗi transaction
      incomingGuestToken,
      userId,
    };
    throw err;
  } finally {
    conn.release();
  }
}

async function updateVersion(cartId, conn = pool) {
  try {
    const sqlUpdateVersion = `
      UPDATE carts
      SET cartVersion = cartVersion + 1
      WHERE id = ?
    `;
    const sqlGetVersion = `
      SELECT cartVersion
      FROM carts
      WHERE id = ?
    `;
    const [result] = await conn.execute(sqlUpdateVersion, [cartId]);
    if (result.affectedRows !== 1) throw new NotFoundError("Cart not found");

    const [rows] = await conn.execute(sqlGetVersion, [cartId]);
    const version = rows[0].cartVersion;
    return version;
  } catch (error) {
    throw error;
  }
}
export default {
  withCart,
  getAllCarts,
  getCart,
  createCart,
  addToCart,
  clearCart,
  ensureCart,
  mergeGuestCartToUser,
  updateVersion,
};

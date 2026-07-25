import pool from "../config/db.js";
import { validateOwner } from "./validators.js";
import cartItemService from "./cartItem.service.js";
import { getVariantById } from "./variant.service.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";

const getAllCarts = async () => {
  const [carts] = await pool.execute("SELECT * FROM carts");
  return carts;
};

const getCart = async ({ userId, guestToken }, { conn, forUpdate = false }) => {
  validateOwner({ userId, guestToken });
  const isLock = forUpdate ? "FOR UPDATE" : "";
  const field = userId ? "userID" : "guestToken";
  const value = userId ?? guestToken;
  const [carts] = await conn.execute(
    `SELECT * FROM carts WHERE ${field} = ? ${isLock}`,
    [value],
  );

  return carts.length > 0 ? carts[0] : null;
};

const createCart = async ({ userId, guestToken }, conn = pool) => {
  validateOwner({ userId, guestToken });

  const field = userId ? "userID" : "guestToken";
  const value = userId ?? guestToken;

  const [result] = await conn.execute(
    `INSERT INTO carts (${field}) VALUES (?)`,
    [value],
  );

  const [rows] = await conn.execute("SELECT * FROM carts WHERE id = ?", [
    result.insertId,
  ]);

  return rows.length > 0 ? rows[0] : null;
};

const addToCart = async (variantId, delta, cartId, connection) => {
  const objLog = {
    variantId,
    cartId,
    delta,
  };
  logger.debug(LOG_ACTIONS.CART.CHANGE_ITEM, {
    status: LOG_STATUSES.STARTED,
    ...objLog,
  });
  // Trước khi update item trong cart thì update version cart
  const variant = await getVariantById(variantId, true, connection);
  if (!variant) {
    logger.warn(LOG_ACTIONS.CART.CHANGE_ITEM, {
      status: LOG_STATUSES.FAILED,
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
  let operation;
  if (!cartItem) {
    if (delta <= 0) {
      logger.warn(LOG_ACTIONS.CART.CHANGE_ITEM, {
        status: LOG_STATUSES.FAILED,
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

    operation = "insert";

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
      operation = "remove";
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
      operation = "update";
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
  logger.info(LOG_ACTIONS.CART.CHANGE_ITEM, {
    status: LOG_STATUSES.SUCCEEDED,
    ...objLog,
    operation,
    quantity: result.quantity,
    cartVersion,
  });
  return { ...result, cartVersion };
};

const mergeGuestCartToUser = async ({ userId, guestToken }) => {
  const connection = await pool.getConnection();
  const transactionStartedAt = Date.now();
  try {
    await connection.beginTransaction();
    logger.debug(LOG_ACTIONS.CART.MERGE_TO_USER, {
      status: LOG_STATUSES.STARTED,
      userId,
    });
    const cartUser = await getCart(
      { userId },
      { conn: connection, forUpdate: true },
    );
    const cartGuest = await getCart(
      { guestToken },
      { conn: connection, forUpdate: true },
    );
    if (!cartGuest) {
      logger.warn(LOG_ACTIONS.CART.MERGE_TO_USER, {
        status: LOG_STATUSES.FAILED,
        reason: "CART_GUEST_NOT_FOUND",
        userId,
      });
      await connection.commit();
      logger.debug(LOG_ACTIONS.TRANSACTION, {
        status: LOG_STATUSES.COMMITTED,
        operation: LOG_ACTIONS.CART.MERGE_TO_USER,
        userId,
        durationMs: Date.now() - transactionStartedAt,
      });
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
    logger.debug(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.COMMITTED,
      operation: LOG_ACTIONS.CART.MERGE_TO_USER,
      userId,
      cartId: cartUser?.id,
      durationMs: Date.now() - transactionStartedAt,
    });
    logger.debug(LOG_ACTIONS.CART.MERGE_TO_USER, {
      status: LOG_STATUSES.SUCCEEDED,
      userId,
    });
    return true;
  } catch (error) {
    await connection.rollback();
    logger.warn(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.ROLLED_BACK,
      operation: LOG_ACTIONS.CART.MERGE_TO_USER,
      reason: error.code || "UNEXPECTED_ERROR",
      userId,
      durationMs: Date.now() - transactionStartedAt,
    });
    logger.warn(LOG_ACTIONS.CART.MERGE_TO_USER, {
      status: LOG_STATUSES.FAILED,
      reason: error.code || "UNEXPECTED_ERROR",
      userId,
    });
    return false;
  } finally {
    connection.release();
  }
};

const clearCart = async (cartId, conn = pool) => {
  const [result] = await conn.execute("DELETE FROM carts WHERE id = ?", [
    cartId,
  ]);
  if (result.affectedRows === 0) {
    logger.warn(LOG_ACTIONS.CART.CLEAR, {
      status: LOG_STATUSES.FAILED,
      reason: "CART_NOT_FOUND",
      cartId,
    });
    throw new NotFoundError("Cart not found");
  }
  return true;
};

const ensureCart = async ({ userId, guestToken }, conn = pool) => {
  validateOwner({ userId, guestToken });
  let cart = await getCart({ userId, guestToken }, { conn, forUpdate: true });
  if (!cart) cart = await createCart({ userId, guestToken }, conn);
  return cart;
};

async function withCart(
  context,
  handler,
  { operation = "cart_operation" } = {},
) {
  const { guestToken: incomingGuestToken, userId } = context ?? {};
  const conn = await pool.getConnection();
  const transactionStartedAt = Date.now();

  let currentCartId = null; // Biến tạm để cứu hộ khi lỗi

  try {
    await conn.beginTransaction();

    let cart;
    if (userId) {
      cart = await ensureCart({ userId }, conn);
    } else {
      cart = await ensureCart({ guestToken: incomingGuestToken }, conn);
    }
    currentCartId = cart.id;
    logger.debug(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.STARTED,
      operation,
      cartId: currentCartId,
      actorType: userId ? "user" : "guest",
      userId,
    });

    const result = await handler({
      cartId: cart.id,
      conn,
      cartVersion: cart.cartVersion,
    });

    await conn.commit();
    logger.debug(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.COMMITTED,
      operation,
      cartId: currentCartId,
      orderId: result?.orderId,
      actorType: userId ? "user" : "guest",
      userId,
      durationMs: Date.now() - transactionStartedAt,
    });
    return result;
  } catch (err) {
    const reason = err.context?.reason || err.code || "UNEXPECTED_ERROR";

    await conn.rollback();
    logger.warn(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.ROLLED_BACK,
      operation,
      reason,
      cartId: currentCartId,
      orderId: err.context?.orderId,
      actorType: userId ? "user" : "guest",
      userId,
      durationMs: Date.now() - transactionStartedAt,
    });
    err.context = {
      ...err.context,
      operation,
      cartId: currentCartId, // để biết giỏ hàng nào bị lỗi transaction
      actorType: userId ? "user" : "guest",
      userId,
    };
    throw err;
  } finally {
    conn.release();
  }
}

async function updateVersion(cartId, conn = pool) {
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

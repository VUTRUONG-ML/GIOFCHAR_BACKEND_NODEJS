import pool from "../config/db.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../errors/AppError.js";
import { generateOrderCode, groupOrders } from "../utils/order.util.js";
import { switchCustomer } from "../utils/switchCustomer.js";
import paymentService from "./payment.service.js";
import { validateOwner } from "./validators.js";

const getAllOrders = async () => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        o.id AS orderId,
        o.orderCode,
        o.status,
        o.paymentStatus,
        o.customerName,
        o.email,
        o.phone,
        o.address AS deliveryAddress,
        o.createdAt AS time,

        SUM(oi.quantity ) as totalQuantity,
        SUM(oi.totalPrice ) as amount
      FROM orders o 
      JOIN order_items oi  ON o.id = oi.orderID
      GROUP BY o.id
      ORDER BY o.createdAt DESC`);
    return rows;
  } catch (err) {
    throw err;
  }
};

const countTodayOrders = async (conn = pool) => {
  try {
    const [result] = await conn.execute(
      `
      SELECT COUNT(o.id) as countOrdered
      FROM orders o
      WHERE o.createdAt >= CURDATE() AND o.createdAt < CURDATE() + INTERVAL 1 DAY
      `,
    );
    return result[0].countOrdered;
  } catch (error) {
    console.log(">>> SERVICE countTodayOrders ERROR:", error.message);
    throw error;
  }
};

const countYesterdayOrders = async (conn = pool) => {
  try {
    const [result] = await conn.execute(
      `
      SELECT COUNT(o.id) as countOrdered
      FROM orders o
      WHERE o.createdAt >= CURDATE() - INTERVAL 1 DAY AND o.createdAt < CURDATE()
      `,
    );
    return result[0].countOrdered;
  } catch (error) {
    console.log(">>> SERVICE countYesterdayOrders ERROR:", error.message);
    throw error;
  }
};

const getOrderById = async (orderId, conn = pool) => {
  try {
    const [rows] = await conn.execute(
      `SELECT
        o.id AS orderId,
        o.orderCode,
        o.status,
        o.paymentStatus,
        o.address AS deliveryAddress,
        o.createdAt AS time
      FROM orders o 
      WHERE id = ?`,
      [orderId],
    );
    return rows[0];
  } catch (err) {
    throw err;
  }
};

const assertOrderUpdatable = async (orderId, conn = pool) => {
  const order = await getOrderById(orderId, conn);

  if (!order) throw new NotFoundError("Order not found");

  const { status: currentStatus } = order;
  if (currentStatus === "cancelled" || currentStatus === "delivered")
    throw new BadRequestError("Order cannot be updated");
};

const getOrdersByUserId = async (userId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        o.id AS orderId,
        o.orderCode,
        o.status,
        o.createdAt AS time,

        (SELECT SUM(oi2.totalPrice )
        FROM order_items oi2 
        WHERE oi2.orderID = o.id
        ) AS amount,

        oi.id as orderItemId,
        f.foodName,
        f.image,
        fv.weight_gram,
        oi.totalPrice,
        oi.quantity
      FROM orders o 
      JOIN order_items oi  ON o.id = oi.orderID
      JOIN food_variants fv ON oi.food_variantID = fv.id
      JOIN foods f ON fv.foodID = f.id
      WHERE o.userID = ?
      ORDER BY o.createdAt`,
      [userId],
    );
    const newRows = groupOrders(rows);
    return newRows;
  } catch (err) {
    throw err;
  }
};

const createOrder = async (
  connection,
  { userId, guestToken },
  customerName,
  email,
  phone,
  address,
) => {
  try {
    validateOwner({ userId, guestToken });

    let field, value;
    if (userId) {
      field = "userID";
      value = userId;
    } else {
      field = "guestToken";
      value = guestToken;
    }

    const [result] = await connection.execute(
      `INSERT INTO orders (${field}, customerName, email, phone, address) VALUES (?, ?, ?, ?, ?)`,
      [value, customerName, email, phone, address],
    );

    const orderId = result.insertId;
    const orderCode = generateOrderCode(orderId);

    await connection.execute("UPDATE orders SET orderCode = ? WHERE id = ?", [
      orderCode,
      orderId,
    ]);

    return { orderId: result.insertId, orderCode };
  } catch (err) {
    throw err;
  }
};

const updateOrderStatus = async (orderId, status, conn = pool) => {
  try {
    if (
      status !== "delivering" &&
      status !== "unconfirmed" &&
      status !== "cancelled" &&
      status !== "delivered"
    )
      throw new BadRequestError("Invalid status order.");
    await assertOrderUpdatable(orderId, conn);
    const [result] = await conn.execute(
      "UPDATE orders o SET status = ? WHERE id = ?",
      [status, orderId],
    );
    if (result.affectedRows !== 1) throw new NotFoundError("Order not found");
    return result.affectedRows === 1;
  } catch (err) {
    throw err;
  }
};

const updateOrderDeliveredCOD = async (
  orderId,
  paymentStatus,
  orderStatus,
  conn = pool,
) => {
  if (
    paymentStatus !== "success" &&
    paymentStatus !== "failed" &&
    paymentStatus !== "pending"
  )
    throw BadRequestError("Invalid status payment");
  if (
    orderStatus !== "delivering" &&
    orderStatus !== "unconfirmed" &&
    orderStatus !== "cancelled" &&
    orderStatus !== "delivered"
  )
    throw new BadRequestError("Invalid status order.");
  try {
    const sql = `
      UPDATE orders
      SET paymentStatus = ?, status = ?
      WHERE id = ?
    `;
    const [result] = await conn.execute(sql, [
      paymentStatus,
      orderStatus,
      orderId,
    ]);
    return result.affectedRows === 1;
  } catch (error) {
    throw error;
  }
};

const updatePaymentStatus = async ({ orderId, paymentStatus }, conn = pool) => {
  try {
    const [result] = await conn.execute(
      "UPDATE orders o SET paymentStatus = ? WHERE id = ?",
      [paymentStatus, orderId],
    );
    return result;
  } catch (err) {
    throw err;
  }
};

const confirmCodOrderPayment = async (orderId, status = "delivered") => {
  const connection = await pool.getConnection();
  try {
    if (status !== "delivered")
      throw new BadRequestError("Invalid status order.");

    await connection.beginTransaction();
    const payment = await paymentService.getByOrderId(orderId, connection);
    if (!payment) throw new NotFoundError("Payment not found for this order.");

    const { paymentId, paymentType } = payment;
    if (paymentType !== "COD")
      throw new BadRequestError("Only COD orders can be confirmed manually");

    await assertOrderUpdatable(orderId, connection);

    const newPaymentStatus = "success";
    const updatedOrder = await updateOrderDeliveredCOD(
      orderId,
      newPaymentStatus,
      status,
      connection,
    );
    if (!updatedOrder) throw new NotFoundError("Order not found");

    await paymentService.updatePaymentById(
      { paymentId, paymentStatus, paymentType },
      connection,
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.log(">>> SERVICE UPDATE DELIVERED ORDER ERROR", error);
    throw error;
  } finally {
    connection.release();
  }
};

const deleteOrder = async (orderId) => {
  try {
    const [result] = await pool.execute("DELETE FROM orders WHERE id = ?", [
      orderId,
    ]);

    return result;
  } catch (err) {
    throw err;
  }
};

const getOrderByIdAndUser = async (orderId, { userId, guestToken }) => {
  try {
    const { field, value } = switchCustomer({ userId, guestToken });
    const [result] = await pool.execute(
      `SELECT * FROM orders WHERE id = ? AND ${field} = ?`,
      [orderId, value],
    );
    return result.length > 0 ? result[0] : null;
  } catch (err) {
    throw err;
  }
};

const attachOrderToUser = async ({ email, userId }) => {
  try {
    await pool.execute(
      `
    UPDATE orders
    SET userID = ?, guestToken = NULL
    WHERE email = ? 
    `,
      [userId, email],
    );
  } catch (error) {
    console.log(">>>>> SERVICE ERROR attach order:", error.message);
    throw error;
  }
};

const revenue = async (conn = pool, time = "default") => {
  const optionTime =
    time === "today"
      ? "WHERE o.createdAt >= CURDATE() AND o.createdAt < CURDATE() + INTERVAL 1 DAY"
      : time === "yesterday"
        ? "WHERE o.createdAt >= CURDATE() - INTERVAL 1 DAY AND o.createdAt < CURDATE()"
        : "";
  try {
    const [result] = await conn.execute(
      `
        SELECT 
          SUM(amount) as revenue
        FROM (SELECT 
                SUM(oi.totalPrice ) as amount
                FROM orders o
                JOIN order_items oi ON o.id = oi.orderID 
                ${optionTime}
                GROUP BY o.id) ordersAmount;
      `,
    );
    return result[0].revenue ? Number(result[0].revenue) : 0;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR revenue:", error.message);
    throw error;
  }
};
const getPaymentStatus = async (orderId) => {
  try {
    const sql = `SELECT id as orderId, paymentStatus FROM orders WHERE id = ?`;
    const [rows] = await pool.execute(sql, [orderId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log(">>> SERVICE ORDER ERROR:", error.message);
    throw error;
  }
};
const getByOrderCode = async ({ orderCode }, conn = pool) => {
  try {
    const sql = `
      SELECT
        o.id as orderId,
        o.status,
        o.paymentStatus,
        o.has_viewed_payment_result,
        SUM(oi.totalPrice) as amount
      FROM orders o 
      JOIN order_items oi ON o.id = oi.orderID 
      WHERE o.orderCode = ?
      GROUP BY  o.id
    `;
    const [rows] = await conn.execute(sql, [orderCode]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log(">>> SERVICE ORDER ERROR:", error.message);
    throw error;
  }
};
const markPaymentResultViewed = async ({ orderId }, conn = pool) => {
  try {
    const sql = `
      UPDATE orders o
      SET has_viewed_payment_result = TRUE, payment_result_viewed_at = CURRENT_TIMESTAMP()
      WHERE id = ? 
        AND o.has_viewed_payment_result = FALSE
    `;
    const [rows] = await conn.execute(sql, [orderId]);
    return rows;
  } catch (error) {
    console.log(">>> SERVICE markPaymentResultViewed ERROR:", error.message);
    throw error;
  }
};
export default {
  getAllOrders,
  countTodayOrders,
  countYesterdayOrders,
  getOrdersByUserId,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderById,
  getOrderByIdAndUser,
  attachOrderToUser,
  revenue,
  confirmCodOrderPayment,
  getByOrderCode,
  getPaymentStatus,
  markPaymentResultViewed,
  updatePaymentStatus,
};

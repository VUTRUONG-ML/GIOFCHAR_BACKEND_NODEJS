const pool = require("../config/db");
const { NotFoundError } = require("../errors/AppError");
const { groupOrderDetail } = require("../utils/order.util");

const getOrderItemsByOrderId = async (orderId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        o.id AS orderId,
        o.orderCode,
        o.createdAt,
        o.updatedAt,
        o.customerName,
        o.email,
        o.phone,
        o.address,
        o.status,
        
        oi.id AS orderItemId,
        oi.quantity,
        oi.unitPrice,
        oi.totalPrice as totalPriceOnOneItem,

        f.foodName,
        f.image,
        fv.weight_gram,
        
        p.paymentType,
        p.status as paymentStatus
      FROM orders o
      JOIN order_items oi ON o.id = oi.orderID
      JOIN food_variants fv ON oi.food_variantID = fv.id
      JOIN foods f ON fv.foodID = f.id
      JOIN payments p ON o.id = p.orderID
      WHERE o.id = ?`,
      [orderId],
    );
    const order = groupOrderDetail(rows);

    if (!order) throw new NotFoundError("Order not found");

    return order;
  } catch (err) {
    throw err;
  }
};

const createOrderItem = async (connection, orderValues) => {
  // orderValues : array[[orderID, foodID, quantity, totalPrice]]
  try {
    // muốn thêm nhiều dòng dữ liệu thì dùng query
    const [result] = await connection.query(
      "INSERT INTO order_items (orderID, foodID, quantity, totalPrice) VALUES ?",
      [orderValues],
    );
    return result.insertId;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getOrderItemsByOrderId,
  createOrderItem,
};

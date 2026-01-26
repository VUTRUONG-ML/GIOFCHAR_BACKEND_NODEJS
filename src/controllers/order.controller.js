const orderService = require("../services/order.service");
const orderItemService = require("../services/order_item.service");
const cartItemService = require("../services/cartItem.service");
const cartService = require("../services/cart.service");
const paymentService = require("../services/payment.service");
const { calculateOrderValues, ordersMap } = require("../utils/order.util");
const pool = require("../config/db");
const { deductStockForOrder } = require("../services/food.service");
const { statusOverview } = require("../utils/status");

const getStatusOverview = async (req, res) => {
  try {
    const resultToday = await orderService.countTodayOrders();
    const resultYes = await orderService.countYesterdayOrders();

    const { status, percent } = statusOverview(resultToday, resultYes);
    return res
      .status(200)
      .json({ countTodayOrders: resultToday, status, percent });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getStatusRevenue = async (req, res) => {
  try {
    const revenueToday = await orderService.revenue(pool, "today");
    const revenueYesterday = await orderService.revenue(pool, "yesterday");
    const { status, percent } = statusOverview(revenueToday, revenueYesterday);
    return res.status(200).json({ revenueToday, status, percent });
  } catch (error) {
    console.log(">>> CONTROLLER ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json({ total: orders.length, orders: orders });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getOrdersByUserId = async (req, res) => {
  const { role } = req.user;
  const userId = role === "admin" ? req.params.userId : req.user.userId;
  try {
    const rows = await orderService.getOrdersByUserId(userId);

    const ordersMap = rows.reduce((acc, row) => {
      const orderId = row.orderId;

      if (!acc[orderId]) {
        acc[orderId] = {
          orderId: row.orderId,
          orderCode: row.orderCode,
          status: row.status,
          time: row.time,
          amount: Number(row.amount),
          items: [],
        };
      }

      acc[orderId].items.push({
        orderItemId: row.orderItemId,
        foodName: row.foodName,
        image: row.image,
        quantity: row.quantity,
      });

      return acc;
    }, {});

    const orders = Object.values(ordersMap);
    res.status(200).json({ total: orders.length, orders });
  } catch (error) {
    console.log(">>>>> CONTROLLER ERROR", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getOrderItemsByOrderId = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const items = await orderItemService.getOrderItemsByOrderId(orderId);
    if (items.length === 0)
      return res.status(404).json({ message: "Order not found" });

    // gộp các trường dùng chung

    const {
      createdAt,
      updatedAt,
      orderCode,
      status,
      customerName,
      email,
      phone,
      paymentType,
      paymentStatus,
      address,
    } = items[0];

    const itemList = items.map(
      ({
        orderCode,
        createdAt,
        updatedAt,
        status,
        customerName,
        email,
        phone,
        paymentType,
        paymentStatus,
        address,
        ...rest
      }) => rest,
    );

    //tinh tong tien cua order
    const amountOrder = itemList.reduce(
      (sum, item) => sum + Number(item.totalPriceOnOneItem),
      0,
    );

    res.status(200).json({
      totalItem: items.length,
      orderCode,
      createdAt,
      updatedAt,
      orderStatus: status,
      address,
      amountOrder,
      customerName,
      phone,
      email,
      paymentType,
      paymentStatus,
      items: itemList,
    });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR getOrderItemsByOrderId", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createOrder = async (req, res) => {
  // cần phải có userId từ params, từ userId -> cartId -> cartItems
  const { userId, guestToken } = req.user; // sau này sẽ lấy từ middleware req.userId
  const cartId = req.cartId; // từ middleware
  const { customerName, email, phone, address } = req.body;
  if (!address || !customerName || !email || !phone)
    return res.status(400).json({ message: "Missing field" });

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction(); // Khởi tạo transaction

    //Lay ve cartItem cua nguoi dung hien tai
    const cartItems = await cartItemService.getCartItemsByCartId(
      cartId,
      connection,
    );
    if (cartItems.length === 0)
      return res.status(400).json({ message: "Empty cart items" });

    // Kiểm tra và trừ đi quatity trước khi thêm vào orderItems
    await deductStockForOrder(connection, cartItems);

    //Tao order
    const { orderId, orderCode } = await orderService.createOrder(
      connection,
      { userId, guestToken },
      customerName,
      email,
      phone,
      address,
    );

    // Tinh cac gia tri de dua vao tao orderItem
    const { orderValues, totalPriceOrder } = calculateOrderValues(
      cartItems,
      orderId,
    );

    await orderItemService.createOrderItem(connection, orderValues);

    const paymentTypeDefault = "COD";
    const transactionDefault = "COD";
    const paymentStatusDefault = "pending";
    await paymentService.createPayment(
      connection,
      orderId,
      paymentTypeDefault,
      totalPriceOrder,
      transactionDefault,
      paymentStatusDefault,
    );
    await cartService.clearCart(cartId, connection);

    await connection.commit();

    res.status(200).json({
      message: "Create order successful",
      orderCode,
      orderId,
      totalPriceOrder: totalPriceOrder,
    });
  } catch (err) {
    await connection.rollback(); // rollback nếu lỗi
    console.error(">>>>> CONTROLLER ERROR Transaction failed:", err);

    if (err.message === "OUT_OF_STOCK") {
      return res
        .status(409)
        .json({ message: "Some products are out of stock." });
    }

    if (err.message === "QUANTITY_ORDER_NEGATIVE") {
      return res.status(400).json({
        message: "The quantity of products ordered must not be negative.",
      });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
};

const updateOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const status = req.body.status;
  if (
    !status ||
    (status !== "delivering" &&
      status !== "unconfirmed" &&
      status !== "cancelled" &&
      status !== "delivered")
  ) {
    return res.status(400).json({ message: "Missing or incorrect status" });
  }
  try {
    const result = await orderService.updateOrderStatus(orderId, status);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Update order status successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const status = "cancelled";
  try {
    const result = await orderService.updateOrderStatus(orderId, status);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Cancel order successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteOrder = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const result = await orderService.deleteOrder(orderId);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Delete order successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
module.exports = {
  getAllOrders,
  getOrdersByUserId,
  getOrderItemsByOrderId,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getStatusOverview,
  getStatusRevenue,
};

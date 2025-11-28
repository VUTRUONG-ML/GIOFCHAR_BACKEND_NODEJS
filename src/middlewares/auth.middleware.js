const jwt = require("jsonwebtoken");
require("dotenv").config();

const orderService = require("../services/order.service");

const verifyToken = (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // {userId, role}
    return next();
  } catch (err) {
    console.log(">>>>> AUTH MIDDLE WARE ERROR", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const authorizeOrderAccess = async (req, res, next) => {
  const userId = req.user.userId;
  const { orderId } = req.params;
  if (req.user.role === "admin") return next();
  try {
    const order = await orderService.getOrderByIdAndUser(orderId, userId);
    if (!order)
      return res.status(403).json({ message: "You do not have access" });

    next();
  } catch (error) {
    console.log(">>>>> MIDDLEEWARE AUTH ERROR", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  verifyToken,
  authorizeOrderAccess,
};

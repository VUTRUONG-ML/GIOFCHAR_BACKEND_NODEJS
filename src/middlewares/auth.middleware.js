const jwt = require("jsonwebtoken");
require("dotenv").config();

const orderService = require("../services/order.service");

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return next();

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
  } catch (err) {
    // token sai coi như guest
    console.log("Optional auth failed:", err.message);
  }

  next();
};

const requireAuth = (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // {userId, role}
    return next();
  } catch (err) {
    console.log(">>>>> AUTH MIDDLE WARE ERROR", err);
    return res.status(401).json({ message: "Invalid or expired token" });
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
  requireAuth,
  authorizeOrderAccess,
};

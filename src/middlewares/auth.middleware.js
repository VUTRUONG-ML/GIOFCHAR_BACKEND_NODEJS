import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import orderService from "../services/order.service.js";

export const optionalAuth = (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  let guestToken = req.headers["x-guest-token"];

  let user = {
    userId: null,
    guestToken: null,
    role: "user",
  };

  // nếu không gửi token
  if (!token) {
    user.guestToken = guestToken;
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // { userId, role }
    user = { ...decoded, guestToken: null };
  } catch (err) {
    // token sai coi như guest
    console.log(">>>>> Optional auth failed:", err.message);
    user.guestToken = guestToken;
  }

  if (!user.userId && !user.guestToken) {
    return res.status(401).json({
      error: {
        code: "GUEST_TOKEN_MISSING",
        message: "Guest token required",
      },
    });
  }
  req.user = user;

  next();
};

export const requireAuth = (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token missing" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { ...decoded, guestToken: null }; // {userId, role}
    return next();
  } catch (err) {
    console.log(">>>>> AUTH MIDDLE WARE ERROR", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorizeOrderAccess = async (req, res, next) => {
  const { userId, guestToken } = req.user;
  const orderId = req.params.orderId || req.order.orderId;
  if (req.user.role === "admin") return next();
  try {
    const order = await orderService.getOrderByIdAndUser(orderId, {
      userId,
      guestToken,
    });
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

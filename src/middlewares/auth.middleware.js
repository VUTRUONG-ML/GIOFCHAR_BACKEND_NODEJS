import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import orderService from "../services/order.service.js";
import { UnauthorizedError } from "../errors/AppError.js";
import { asyncHandler } from "../errors/errorHandler.js";

export const optionalAuth = asyncHandler((req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  let guestToken = req.headers["x-guest-token"];

  let user = {
    userId: null,
    guestToken: null,
    role: "user",
  };

  // nếu không gửi token
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // { userId, role }
      user = { userId: decoded.userId, role: decoded.role, guestToken: null };
    } catch (err) {
      // token sai trả về mã lỗi để fe biết tự gọi refreshToken
      console.log(">>>>> Optional auth failed:", err.message);
      if (err.name === "TokenExpiredError") {
        throw new UnauthorizedError(
          "Invalid or expired token",
          "ACCESS_TOKEN_EXPIRED",
        );
      }

      if (err.name === "JsonWebTokenError") {
        throw new UnauthorizedError(
          "Invalid or expired token",
          "INVALID_ACCESS_TOKEN",
        );
      }
      throw err;
    }
  } else {
    user.guestToken = guestToken;
  }

  if (!user.userId && !user.guestToken) {
    throw new UnauthorizedError("Guest token required", "GUEST_TOKEN_MISSING");
  }

  req.user = user;

  next();
});

export const requireAuth = asyncHandler((req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) throw new UnauthorizedError("Access token missing");
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role, guestToken: null }; // {userId, role}
    return next();
  } catch (err) {
    console.log(">>>>> AUTH MIDDLE WARE ERROR", err.message);

    if (err.name === "TokenExpiredError") {
      throw new UnauthorizedError(
        "Invalid or expired token",
        "ACCESS_TOKEN_EXPIRED",
      );
    }

    if (err.name === "JsonWebTokenError") {
      throw new UnauthorizedError(
        "Invalid or expired token",
        "INVALID_ACCESS_TOKEN",
      );
    }

    throw err;
  }
});

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

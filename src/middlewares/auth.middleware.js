import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import orderService from "../services/order.service.js";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { asyncHandler } from "../errors/errorHandler.js";
import { LOG_EVENTS } from "../constants/logEvents.js";
import logger from "../config/logger.js";

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
      logger.debug(LOG_EVENTS.AUTH.success.AUTHENTICATION, {
        userId: user.userId,
        path: req.originalUrl,
      });
    } catch (err) {
      // token sai trả về mã lỗi để fe biết tự gọi refreshToken
      if (
        err.name === "TokenExpiredError" ||
        err.name === "JsonWebTokenError"
      ) {
        const reason =
          err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
        const code =
          err.name === "TokenExpiredError"
            ? "ACCESS_TOKEN_EXPIRED"
            : "INVALID_ACCESS_TOKEN";

        logger.warn(LOG_EVENTS.AUTH.failed.AUTHENTICATION, {
          reason,
          path: req.originalUrl,
          message: err.message,
        });

        throw new UnauthorizedError("Invalid or expired token", code);
      }
      throw err;
    }
  } else {
    user.guestToken = guestToken;
    logger.debug(LOG_EVENTS.AUTH.success.AUTHENTICATION, {
      guestToken: guestToken,
      path: req.originalUrl,
    });
  }

  if (!user.userId && !user.guestToken) {
    logger.warn(LOG_EVENTS.AUTH.failed.AUTHENTICATION, {
      reason: "GUEST_TOKEN_MISSING",
      path: req.originalUrl,
      ip: req.ip,
    });
    throw new UnauthorizedError("Guest token required", "GUEST_TOKEN_MISSING");
  }

  req.user = user;

  next();
});

export const requireAuth = asyncHandler((req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) {
    logger.warn(LOG_EVENTS.AUTH.failed.AUTHENTICATION, {
      reason: "TOKEN_MISSING",
      path: req.originalUrl,
      ip: req.ip,
    });
    throw new UnauthorizedError("Access token missing");
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role, guestToken: null }; // {userId, role}
    logger.debug(LOG_EVENTS.AUTH.success.AUTHENTICATION, {
      userId: decoded.userId,
      path: req.originalUrl,
    });
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      const reason =
        err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
      const code =
        err.name === "TokenExpiredError"
          ? "ACCESS_TOKEN_EXPIRED"
          : "INVALID_ACCESS_TOKEN";

      logger.warn(LOG_EVENTS.AUTH.failed.AUTHENTICATION, {
        reason,
        path: req.originalUrl,
        message: err.message,
      });

      throw new UnauthorizedError("Invalid or expired token", code);
    }
    throw err;
  }
});

export const authorizeOrderAccess = asyncHandler(async (req, res, next) => {
  const { userId, guestToken } = req.user;
  const orderId = req.params.orderId || req.order.orderId;

  logger.debug("ORDER_AUTHORIZE_START", { orderId, userId, role });

  if (req.user.role === "admin") return next();

  const order = await orderService.getOrderByIdAndUser(orderId, {
    userId,
    guestToken,
  });
  if (!order) {
    logger.warn("ORDER_ACCESS_DENIED", { orderId, userId, guestToken });
    throw new ForbiddenError("You do not have access");
  }

  next();
});

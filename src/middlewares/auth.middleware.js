import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import orderService from "../services/order.service.js";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { asyncHandler } from "../errors/errorHandler.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";
import logger from "../config/logger.js";

export const optionalAuth = asyncHandler((req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  const guestToken = req.headers["x-guest-token"];

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

        logger.warn(LOG_ACTIONS.AUTH.AUTHENTICATE, {
          status: LOG_STATUSES.FAILED,
          reason,
          path: req.originalUrl,
        });

        throw new UnauthorizedError("Invalid or expired token", code);
      }
      throw err;
    }
  } else {
    user.guestToken = guestToken;
  }

  if (!user.userId && !user.guestToken) {
    logger.warn(LOG_ACTIONS.AUTH.AUTHENTICATE, {
      status: LOG_STATUSES.FAILED,
      reason: "GUEST_TOKEN_MISSING",
      path: req.originalUrl,
      ip: req.ip,
    });
    throw new UnauthorizedError("Guest token required", "GUEST_TOKEN_MISSING");
  }

  logger.debug(LOG_ACTIONS.AUTH.AUTHENTICATE, {
    status: LOG_STATUSES.SUCCEEDED,
    actorType: user.userId ? "user" : "guest",
    userId: user.userId,
    path: req.originalUrl,
  });

  req.user = user;

  next();
});

export const requireAuth = asyncHandler((req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) {
    logger.warn(LOG_ACTIONS.AUTH.AUTHENTICATE, {
      status: LOG_STATUSES.FAILED,
      reason: "TOKEN_MISSING",
      path: req.originalUrl,
      ip: req.ip,
    });
    throw new UnauthorizedError("Access token missing");
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role, guestToken: null }; // {userId, role}
    logger.debug(LOG_ACTIONS.AUTH.AUTHENTICATE, {
      status: LOG_STATUSES.SUCCEEDED,
      actorType: "user",
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

      logger.warn(LOG_ACTIONS.AUTH.AUTHENTICATE, {
        status: LOG_STATUSES.FAILED,
        reason,
        path: req.originalUrl,
      });

      throw new UnauthorizedError("Invalid or expired token", code);
    }
    throw err;
  }
});

export const authorizeOrderAccess = asyncHandler(async (req, res, next) => {
  const { userId, guestToken } = req.user;
  const orderId = req.params.orderId || req.order.orderId;

  logger.debug(LOG_ACTIONS.AUTH.AUTHORIZE_ACCESS, {
    status: LOG_STATUSES.STARTED,
    resourceType: "order",
    resourceId: orderId,
    actorType: userId ? "user" : "guest",
    userId,
    role: req.user.role,
  });

  if (req.user.role === "admin") {
    logger.debug(LOG_ACTIONS.AUTH.AUTHORIZE_ACCESS, {
      status: LOG_STATUSES.ALLOWED,
      resourceType: "order",
      resourceId: orderId,
      actorType: "user",
      userId,
      role: req.user.role,
      authorizationRule: "ADMIN",
    });
    return next();
  }

  const order = await orderService.getOrderByIdAndUser(orderId, {
    userId,
    guestToken,
  });
  if (!order) {
    logger.warn(LOG_ACTIONS.AUTH.AUTHORIZE_ACCESS, {
      status: LOG_STATUSES.DENIED,
      resourceType: "order",
      resourceId: orderId,
      actorType: userId ? "user" : "guest",
      userId,
      reason: "NOT_RESOURCE_OWNER",
    });
    throw new ForbiddenError("You do not have access");
  }

  logger.debug(LOG_ACTIONS.AUTH.AUTHORIZE_ACCESS, {
    status: LOG_STATUSES.ALLOWED,
    resourceType: "order",
    resourceId: orderId,
    actorType: userId ? "user" : "guest",
    userId,
    authorizationRule: "RESOURCE_OWNER",
  });

  return next();
});

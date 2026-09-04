import pool from "../config/db.js";
import bcrypt from "bcrypt";
import userService from "./user.service.js";
import dotenv from "dotenv";
dotenv.config();
import {
  createRefreshToken,
  findValidToken,
  markRevoked,
} from "./refreshToken.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/token.js";
import { ConflictError, UnauthorizedError } from "../errors/AppError.js";
import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";
import orderService from "./order.service.js";
import cartService from "./cart.service.js";

const saltRounds = 10;
const register = async (
  userName,
  email,
  phone,
  password,
  address = null,
  guestToken = null,
) => {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  let optionExecute = {
    sql: "",
    values: [],
  };
  if (!address) {
    optionExecute = {
      sql: "INSERT INTO users (userName, email, phone, password) VALUES (?, ?, ?, ?)",
      values: [userName, email, phone, hashedPassword],
    };
  } else {
    optionExecute = {
      sql: "INSERT INTO users (userName, email, phone, password, address) VALUES (?, ?, ?, ?, ?)",
      values: [userName, email, phone, hashedPassword, address],
    };
  }
  try {
    const [result] = await pool.execute({ ...optionExecute });
    const userId = result.insertId;
    logger.info(LOG_ACTIONS.AUTH.REGISTER, {
      status: LOG_STATUSES.SUCCEEDED,
      userId,
    });

    if (guestToken) {
      await orderService.tryAttachOrderToUser({
        email,
        userId,
      });
    }

    return result;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      let field = "";
      if (err.message.includes("email")) field = "email";
      else if (err.message.includes("phone")) field = "phone";

      logger.warn(LOG_ACTIONS.AUTH.REGISTER, {
        status: LOG_STATUSES.FAILED,
        reason: "CONFLICT",
        field,
      });
      throw new ConflictError(`${field} already exists`);
    }
    throw err;
  }
};

const login = async (email, password, guestToken = null) => {
  const user = await userService.getUserByEmail(email);
  // 1. Kiểm tra email/ password
  if (!user) {
    logger.warn(LOG_ACTIONS.AUTH.LOGIN, {
      status: LOG_STATUSES.FAILED,
      reason: "EMAIL_NOT_FOUND",
    });
    throw new UnauthorizedError("Email/password không chính xác!");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn(LOG_ACTIONS.AUTH.LOGIN, {
      status: LOG_STATUSES.FAILED,
      reason: "WRONG_PASSWORD",
      userId: user.id,
    });
    throw new UnauthorizedError("Email/password không chính xác!");
  }

  // 2. Tạo Token
  const payload = { userId: user.id, role: user.role };
  const access_token = generateAccessToken(payload);
  const refresh_token = generateRefreshToken(payload);

  // 3. Lưu Refresh Token vào DB
  await createRefreshToken({ userId: user.id, refreshToken: refresh_token });

  logger.info(LOG_ACTIONS.AUTH.LOGIN, {
    status: LOG_STATUSES.SUCCEEDED,
    userId: user.id,
  });
  const { password: _, createdAt, updatedAt, ...userWithoutPassword } = user;

  // 4. Đăng nhập xong thì merge giỏ hàng
  let mergeStatus = true;
  if (guestToken) {
    mergeStatus = await cartService.mergeGuestCartToUser({
      userId: user.id,
      guestToken,
    });
  }

  return {
    refresh_token,
    access_token,
    user: userWithoutPassword,
    mergeStatus,
  };
};

const logout = async (refreshToken, conn = pool) => {
  const connection = await conn.getConnection();
  const transactionStartedAt = Date.now();
  let transactionUserId;
  try {
    await connection.beginTransaction();
    // hash token
    const tokenHash = hashToken(refreshToken);
    // tim token
    const tokenInDB = await findValidToken(tokenHash, connection);
    if (!tokenInDB) {
      logger.warn(LOG_ACTIONS.AUTH.LOGOUT, {
        status: LOG_STATUSES.FAILED,
        reason: "INVALID_REFRESH_TOKEN",
      });
      throw new UnauthorizedError("Invalid refresh token.");
    }
    transactionUserId = tokenInDB.userId;
    // revoke token
    await markRevoked(tokenInDB.tokenId, connection);
    await connection.commit();
    logger.debug(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.COMMITTED,
      operation: LOG_ACTIONS.AUTH.LOGOUT,
      userId: tokenInDB.userId,
      durationMs: Date.now() - transactionStartedAt,
    });
    logger.info(LOG_ACTIONS.AUTH.LOGOUT, {
      status: LOG_STATUSES.SUCCEEDED,
      userId: tokenInDB.userId,
    });
    return true;
  } catch (error) {
    await connection.rollback();
    logger.warn(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.ROLLED_BACK,
      operation: LOG_ACTIONS.AUTH.LOGOUT,
      reason: error.code || "UNEXPECTED_ERROR",
      userId: transactionUserId,
      durationMs: Date.now() - transactionStartedAt,
    });
    throw error;
  } finally {
    connection.release();
  }
};

export default { logout, register, login };

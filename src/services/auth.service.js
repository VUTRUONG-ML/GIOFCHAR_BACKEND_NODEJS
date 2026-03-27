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
import { LOG_EVENTS } from "../constants/logEvents.js";
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
    logger.info("User created", { userId, email });

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

      logger.warn(LOG_EVENTS.AUTH.failed.REGISTER, {
        reason: "CONFLICT",
        field,
        email,
        userName,
      });
      throw new ConflictError(`${field} already exists`);
    }
    err.context = { email, action: "USER_REGISTRATION" };
    throw err;
  }
};

const login = async (email, password, guestToken = null) => {
  try {
    const user = await userService.getUserByEmail(email);
    // 1. Kiểm tra email/ password
    if (!user) {
      logger.warn(LOG_EVENTS.AUTH.failed.LOGIN, {
        reason: "EMAIL_NOT_FOUND",
        email,
      });
      throw new UnauthorizedError("Email/password không chính xác!");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(LOG_EVENTS.AUTH.failed.LOGIN, {
        reason: "WRONG_PASSWORD",
        email,
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

    logger.info("User login success", { userId: user.id, email });
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
  } catch (err) {
    err.context = { action: "LOGIN_SYSTEM_ERROR", email };
    throw err;
  }
};

const logout = async (refreshToken, conn = pool) => {
  const connection = await conn.getConnection();
  try {
    await connection.beginTransaction();
    // hash token
    const tokenHash = hashToken(refreshToken);
    // tim token
    const tokenInDB = await findValidToken(tokenHash, connection);
    if (!tokenInDB) {
      logger.warn(LOG_EVENTS.AUTH.failed.LOGOUT, {
        reason: "Invalid refresh token",
        action: "logout",
        tokenHash,
      });
      throw new UnauthorizedError("Invalid refresh token.");
    }
    // revoke token
    await markRevoked(tokenInDB.tokenId, connection);
    await connection.commit();
    logger.info("User logout success", { userId: tokenInDB.userId });
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default { logout, register, login };

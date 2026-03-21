import pool from "../config/db.js";
import bcrypt from "bcrypt";
import userService from "./user.service.js";
import dotenv from "dotenv";
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
dotenv.config();
const saltRounds = 10;
const register = async (userName, email, phone, password, address = null) => {
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
    logger.info("User created", { userId: result.insertId, email });
    return result;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      let field = "";
      if (err.message.includes("email")) field = "email";
      else if (err.message.includes("phone")) field = "phone";

      logger.warn("Register conflict", { field, email, userName });
      throw new ConflictError(`${field} already exists`);
    }
    err.context = { email, action: "USER_REGISTRATION" };
    throw err;
  }
};

const login = async (email, password) => {
  try {
    const user = await userService.getUserByEmail(email);
    // 1. Kiểm tra email/ password
    if (!user) {
      logger.warn("Login attempt failed: Email not found", { email });
      throw new UnauthorizedError("Email/password không chính xác!");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn("Login attempt failed: Wrong password", {
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
    return {
      refresh_token,
      access_token,
      user: userWithoutPassword,
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
      logger.warn("Invalid refresh token attempt", {
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

import pool from "../config/db.js";
import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";
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
  verifyRefreshToken,
} from "../utils/token.js";
import { ConflictError, UnauthorizedError } from "../errors/AppError.js";
dotenv.config();
const saltRounds = 10;
const register = async (userName, email, phone, password, address = null) => {
  const isAddress = address !== null;
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
    return result;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      let field = "";
      if (err.message.includes("email")) field = "email";
      else if (err.message.includes("phone")) field = "phone";

      throw new ConflictError(`${field} already exists`);
    }
    throw err;
  }
};

const login = async (email, password) => {
  try {
    const user = await userService.getUserByEmail(email);

    if (!user) throw new UnauthorizedError("Email/password không chính xác!");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      throw new UnauthorizedError("Email/password không chính xác!");

    const payloadAccessToken = {
      userId: user.id,
      role: user.role,
    };
    const access_token = generateAccessToken(payloadAccessToken);

    const payloadRefreshToken = {
      userId: user.id,
      role: user.role,
    };
    const refresh_token = generateRefreshToken(payloadRefreshToken);

    await createRefreshToken({ userId: user.id, refreshToken: refresh_token });

    const { password: _, createdAt, updatedAt, ...userWithoutPassword } = user;
    return {
      refresh_token,
      access_token,
      user: userWithoutPassword,
    };
  } catch (err) {
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
    if (!tokenInDB) throw new UnauthorizedError("Invalid refresh token.");
    // revoke token
    await markRevoked(tokenInDB.tokenId, connection);
    await connection.commit();
    return true;
  } catch (error) {
    console.log(">>> LOGOUT SERVICE ERROR:", error.message);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default { logout, register, login };

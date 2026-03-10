import pool from "../config/db.js";
import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";
import userService from "./user.service.js";
import dotenv from "dotenv";
import { createRefreshToken } from "./refreshToken.service.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
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
    throw err;
  }
};

const login = async (email, password) => {
  try {
    const user = await userService.getUserByEmail(email);

    const errorLogin = new Error("Email/password không chính xác!");
    errorLogin.statusCode = 401;
    if (!user) throw errorLogin;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw errorLogin;

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

export default {
  register,
  login,
};

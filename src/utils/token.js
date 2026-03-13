import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UnauthorizedError } from "../errors/AppError.js";
import crypto from "crypto";
dotenv.config();
export function generateAccessToken(payload) {
  const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });
  return token;
}

export function generateRefreshToken(payload) {
  const token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });
  return token;
}

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyRefreshToken = (token) => {
  try {
    const decode = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    return decode;
  } catch (error) {
    throw new UnauthorizedError(
      "Refresh token expired or invalid signature",
      "INVALID_REFRESH_TOKEN",
    );
  }
};

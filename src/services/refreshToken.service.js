import dayjs from "dayjs";
import pool from "../config/db.js";
import dotenv from "dotenv";
import ms from "ms";
import crypto from "crypto";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";
dotenv.config();

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const createRefreshToken = async (
  { userId, refreshToken },
  conn = pool,
) => {
  if (!userId) throw new BadRequestError("Missing userId.");
  if (!refreshToken) throw new BadRequestError("Missing refresh token");
  const expiresAt = new Date(
    Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES_IN),
  );
  const tokenHash = hashToken(refreshToken);
  const sql = `
    INSERT INTO refresh_tokens (userID, tokenHash, expiresAt)
    VALUES (?, ?, ?)
  `;
  const values = [userId, tokenHash, expiresAt];
  try {
    const [result] = await conn.execute(sql, values);
    return { tokenId: result.insertId };
  } catch (error) {
    console.log(">>> SERVICE refresh_token ERROR:", error.message);
    throw error;
  }
};

export const getByTokenId = async (tokenId, conn = pool) => {
  const sql = `
        SELECT 
            id as tokenId,
            userID as userId
        FROM refresh_tokens
        WHERE id = ?
    `;
  try {
    const [rows] = await conn.execute(sql, [tokenId]);
    return rows[0];
  } catch (error) {
    console.log(">>> SERVICE refresh token ERROR:", error.message);
    throw error;
  }
};

export const getByUserId = async (userId, conn = pool) => {
  const sql = `
        SELECT 
            id as tokenId,
            userID as userId
        FROM refresh_tokens
        WHERE userID = ?
    `;
  try {
    const [rows] = await conn.execute(sql, [userId]);
    return rows[0];
  } catch (error) {
    console.log(">>> SERVICE refresh token ERROR:", error.message);
    throw error;
  }
};

export const deleteRefreshToken = async (tokenId, conn = pool) => {
  const sql = `
    DELETE FROM refresh_tokens WHERE id = ?
  `;
  try {
    const [result] = await conn.execute(sql, [tokenId]);
    if (result.affectedRows !== 1) throw new NotFoundError("Token not found.");
    return true;
  } catch (error) {
    console.log(">>> SERVICE Token ERROR:", error.message);
    throw error;
  }
};

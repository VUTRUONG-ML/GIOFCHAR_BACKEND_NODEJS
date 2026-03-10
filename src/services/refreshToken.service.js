import dayjs from "dayjs";
import pool from "../config/db.js";
import dotenv from "dotenv";
import ms from "ms";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../utils/token.js";
dotenv.config();

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
        WHERE id = ? AND revoked = FALSE
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
        WHERE userID = ? AND revoked = FALSE
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

export const markRevoked = async (tokenId, conn = pool) => {
  const sql = `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE id = ?
  `;
  try {
    const [result] = await conn.execute(sql, [tokenId]);
    if (result.affectedRows !== 1) throw new NotFoundError("Token not found.");
    return true;
  } catch (error) {
    console.log(">>> SERVICE token ERROR:", error.message);
    throw error;
  }
};

export const refreshNewToken = async (refreshToken) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // verify token lấy ra {userId}
    const decode = verifyRefreshToken(refreshToken); // {userId, role} // đã throw lỗi nếu ko verify được
    const { userId, role } = decode;
    // hash token
    const tokenHash = hashToken(refreshToken);
    // lấy token thông quua tokenHash và userId và xem có revoked không
    const oldToken = await findValidToken({ tokenHash, userId }, connection);
    // nếu không có trả về lỗi
    if (!oldToken) throw new UnauthorizedError("Invalid refresh token.");
    // nếu có thì tạo token mới và revoke token cũ
    const payload = {
      userId,
      role,
    };
    const newRefreshToken = generateRefreshToken(payload);

    await createRefreshToken(
      { userId, refreshToken: newRefreshToken },
      connection,
    ); // ghi vào database trước
    await markRevoked(oldToken.tokenId, connection); // đánh đấu revoked token cũu

    // generate access token
    const newAccessToken = generateAccessToken(payload);
    await connection.commit();
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.log(">>> SERVICE refresh token ERROR:", error.message);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const findValidToken = async ({ tokenHash, userId }, conn = pool) => {
  const sql = `
    SELECT 
      id as tokenId,
      userID as userId,
      tokenHash,
      revoked,
      expiresAt
    FROM refresh_tokens
    WHERE tokenHash = ? AND userID = ? AND revoked = FALSE AND NOW() < expiresAt
  `;
  try {
    const [rows] = await conn.execute(sql, [tokenHash, userId]);
    return rows[0];
  } catch (error) {
    console.log(">>> SERVICE refresh token ERROR:", error.message);
    throw error;
  }
};

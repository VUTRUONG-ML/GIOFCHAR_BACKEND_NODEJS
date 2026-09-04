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
import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";
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

  const [result] = await conn.execute(sql, values);
  return { tokenId: result.insertId };
};

export const getByTokenId = async (tokenId, conn = pool) => {
  const sql = `
        SELECT 
            id as tokenId,
            userID as userId
        FROM refresh_tokens
        WHERE id = ? AND revoked = FALSE
    `;
  const [rows] = await conn.execute(sql, [tokenId]);
  return rows[0];
};

export const getByUserId = async (userId, conn = pool) => {
  const sql = `
        SELECT 
            id as tokenId,
            userID as userId
        FROM refresh_tokens
        WHERE userID = ? AND revoked = FALSE
    `;
  const [rows] = await conn.execute(sql, [userId]);
  return rows[0];
};

export const deleteRefreshToken = async (tokenId, conn = pool) => {
  const sql = `
    DELETE FROM refresh_tokens WHERE id = ?
  `;
  const [result] = await conn.execute(sql, [tokenId]);
  if (result.affectedRows !== 1) throw new NotFoundError("Token not found.");
  return true;
};

export const markRevoked = async (tokenId, conn = pool) => {
  const sql = `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE id = ?
  `;
  const [result] = await conn.execute(sql, [tokenId]);
  if (result.affectedRows !== 1) throw new NotFoundError("Token not found.");
  return true;
};

export const refreshNewToken = async (refreshToken) => {
  const connection = await pool.getConnection();
  const transactionStartedAt = Date.now();
  let transactionUserId;
  try {
    await connection.beginTransaction();
    // verify token lấy ra {userId}
    const decode = verifyRefreshToken(refreshToken); // {userId, role} // đã throw lỗi nếu ko verify được
    const { userId, role } = decode;
    transactionUserId = userId;
    // hash token
    const tokenHash = hashToken(refreshToken);
    // lấy token thông quua tokenHash và userId và xem có revoked không
    const oldToken = await findValidToken(tokenHash, connection);
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
    logger.debug(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.COMMITTED,
      operation: "rotate_refresh_token",
      userId,
      durationMs: Date.now() - transactionStartedAt,
    });
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    await connection.rollback();
    logger.warn(LOG_ACTIONS.TRANSACTION, {
      status: LOG_STATUSES.ROLLED_BACK,
      operation: "rotate_refresh_token",
      reason: error.code || "UNEXPECTED_ERROR",
      userId: transactionUserId,
      durationMs: Date.now() - transactionStartedAt,
    });
    throw error;
  } finally {
    connection.release();
  }
};

export const findValidToken = async (tokenHash, conn = pool) => {
  const sql = `
    SELECT 
      id as tokenId,
      userID as userId,
      tokenHash,
      revoked,
      expiresAt
    FROM refresh_tokens
    WHERE tokenHash = ? AND revoked = FALSE AND NOW() < expiresAt
  `;
  const [rows] = await conn.execute(sql, [tokenHash]);
  return rows[0];
};

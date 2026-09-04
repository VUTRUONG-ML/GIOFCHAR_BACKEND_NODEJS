import pool from "../config/db.js";
import { NotFoundError, ConflictError } from "../errors/AppError.js";
import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";

const getAllUsersWithOrderCount = async () => {
  const [users] = await pool.execute(`
      SELECT 
        u.id as userId,
        u.userName,
        u.email,
        u.phone,
        u.createdAt as registerDate,
        u.isActive as isActiveAccount,
        
        COUNT(o.id) AS orderCount
      FROM users u
      LEFT JOIN orders o ON o.userID = u.id
      GROUP BY u.id`);
  return users;
};

const getUserById = async (userId) => {
  const [users] = await pool.execute(
    `SELECT 
        userName,
        email,
        phone,
        address,
        role 
      FROM users WHERE id = ?`,
    [userId],
  );
  if (users.length === 0) {
    throw new NotFoundError("User not found");
  }
  return users[0];
};

const createUser = async (userName, email, phone, address, password) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO users (userName, email, phone, address, password)
                                        VALUES (?, ?, ?, ?, ?)`,
      [userName, email, phone, address, password],
    );
    logger.info(LOG_ACTIONS.USER.CREATE, {
      status: LOG_STATUSES.SUCCEEDED,
      userId: result.insertId,
    });
    return { insertId: result.insertId };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      let field = "Field";
      if (err.message.includes("email")) field = "email";
      else if (err.message.includes("phone")) field = "phone";

      logger.warn(LOG_ACTIONS.USER.CREATE, {
        status: LOG_STATUSES.FAILED,
        reason: "DUPLICATE_FIELD",
        field,
      });
      throw new ConflictError(`${field} already exists`);
    }
    throw err;
  }
};

const updateUserById = async (userId, userName, email, phone, address) => {
  try {
    const [result] = await pool.execute(
      `UPDATE users 
        SET email = ?, userName = ?, phone = ?, address = ?
        WHERE id = ?`,
      [email, userName, phone, address, userId],
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError("User not found");
    }
    logger.info(LOG_ACTIONS.USER.UPDATE, {
      status: LOG_STATUSES.SUCCEEDED,
      userId,
      updatedFields: ["userName", "email", "phone", "address"],
    });
    return result;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      let field = "Field";
      if (err.message.includes("email")) field = "email";
      else if (err.message.includes("phone")) field = "phone";

      logger.warn(LOG_ACTIONS.USER.UPDATE, {
        status: LOG_STATUSES.FAILED,
        reason: "DUPLICATE_FIELD",
        field,
        userId,
      });
      throw new ConflictError(`${field} already exists`);
    }
    throw err;
  }
};

const updateActiveUserById = async (userId, active) => {
  const [result] = await pool.execute(
    `UPDATE users 
        SET isActive = ?
        WHERE id = ?`,
    [active, userId],
  );
  if (result.affectedRows === 0) {
    throw new NotFoundError("User not found");
  }
  logger.info(LOG_ACTIONS.USER.UPDATE, {
    status: LOG_STATUSES.SUCCEEDED,
    userId,
    updatedFields: ["isActive"],
    isActive: active,
  });
  return result;
};

const deleteUserById = async (userId) => {
  const [result] = await pool.execute(`DELETE FROM users WHERE id = ?`, [
    userId,
  ]);
  if (result.affectedRows === 0) {
    throw new NotFoundError("User not found");
  }
  logger.info(LOG_ACTIONS.USER.DELETE, {
    status: LOG_STATUSES.SUCCEEDED,
    userId,
  });
  return result;
};

const getUserByEmail = async (email) => {
  const [result] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [
    email,
  ]);
  return result.length > 0 ? result[0] : null;
};

const countUser = async (conn = pool, time = "default") => {
  const condition =
    time === "today"
      ? "WHERE u.createdAt >= CURDATE() AND u.createdAt < CURDATE() + INTERVAL  1 DAY"
      : time === "yesterday"
        ? "WHERE u.createdAt >= CURDATE() - INTERVAL 1 DAY AND u.createdAt < CURDATE()"
        : "";
  const [result] = await conn.execute(
    `
        SELECT 
          COUNT(*) as countUser
        FROM users u 
        ${condition}
      `,
  );
  return result[0].countUser;
};

export default {
  getAllUsersWithOrderCount,
  updateActiveUserById,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  getUserByEmail,
  countUser,
};

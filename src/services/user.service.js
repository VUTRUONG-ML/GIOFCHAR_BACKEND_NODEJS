const pool = require("../config/db");

const getAllUsersWithOrderCount = async () => {
  try {
    // For pool initialization, see above
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
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const getUserById = async (userId) => {
  try {
    // For pool initialization, see above
    const [users] = await pool.execute(
      `SELECT 
        userName,
        email,
        phone,
        address,
        role 
      FROM users WHERE id = ?`,
      [userId]
    );
    return users.length > 0 ? users[0] : null;
  } catch (err) {
    console.log(">>>>> Service error", err);
    throw err;
  }
};

const createUser = async (userName, email, phone, address, password) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO users (userName, email, phone, address, password)
                                        VALUES (?, ?, ?, ?, ?)`,
      [userName, email, phone, address, password]
    );
    return { insertId: result.insertId };
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const updateUserById = async (userId, userName, email, phone, address) => {
  try {
    const [result] = await pool.execute(
      `UPDATE users 
        SET email = ?, userName = ?, phone = ?, address = ?
        WHERE id = ?`,
      [email, userName, phone, address, userId]
    );
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const updateActiveUserById = async (userId, active) => {
  try {
    const [result] = await pool.execute(
      `UPDATE users 
        SET isActive = ?
        WHERE id = ?`,
      [active, userId]
    );
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const deleteUserById = async (userId) => {
  try {
    const [result] = await pool.execute(`DELETE FROM users WHERE id = ?`, [
      userId,
    ]);
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const getUserByEmail = async (email) => {
  try {
    const [result] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [
      email,
    ]);
    return result.length > 0 ? result[0] : null;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getAllUsersWithOrderCount,
  updateActiveUserById,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  getUserByEmail,
};

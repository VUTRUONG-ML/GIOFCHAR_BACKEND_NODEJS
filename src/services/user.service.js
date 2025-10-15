const pool = require("../config/db");

const getAllUsers = async () => {
  try {
    // For pool initialization, see above
    const [users] = await pool.execute("SELECT * FROM users");
    return users;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const getUserById = async (userId) => {
  try {
    // For pool initialization, see above
    const [users] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    return users;
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

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
};

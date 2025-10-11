const pool = require("../config/db");

const getAllUsers = async () => {
  try {
    // For pool initialization, see above
    const [rows, fields] = await pool.query("SELECT * FROM users");
    return rows;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

module.exports = {
  getAllUsers,
};

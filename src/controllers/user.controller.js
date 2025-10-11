const userService = require("../services/user.service");

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    console.log("Error in getAllUsers:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllUsers,
};

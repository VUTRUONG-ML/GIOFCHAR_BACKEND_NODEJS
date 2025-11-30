const userService = require("../services/user.service");

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsersWithOrderCount();
    if (userService.length === 0)
      return res.status(404).json({ message: "Empty Users list" });

    res.status(200).json({ totalUser: users.length, users });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getUserById = async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await userService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createUser = async (req, res) => {
  const { userName, email, phone, address, password } = req.body;
  if (!userName || !email || !phone || !address || !password) {
    return res.status(400).json({ message: "Missing field" });
  }

  try {
    const result = await userService.createUser(
      userName,
      email,
      phone,
      address,
      password
    );

    res
      .status(201)
      .json({ message: "Create user successful", userId: result.insertId });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);

    if (err.code === "ER_DUP_ENTRY") {
      let field = "";
      if (err.message.includes("userName")) field = "username";
      else if (err.message.includes("email")) field = "email";
      else if (err.message.includes("phone")) field = "phone";

      return res.status(409).json({
        message: `${field} already exists`,
      });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateUserById = async (req, res) => {
  const userId = req.params.userId;
  const { userName, email, phone, address } = req.body;
  if (!userName || !email || !phone || !address) {
    return res.status(400).json({ message: "Missing field" });
  }
  try {
    const result = await userService.updateUserById(
      userId,
      userName,
      email,
      phone,
      address
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Update user successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);

    if (err.code === "ER_DUP_ENTRY") {
      let field = "";
      if (err.message.includes("userName")) field = "username";
      else if (err.message.includes("email")) field = "email";
      else if (err.message.includes("phone")) field = "phone";

      return res.status(409).json({
        message: `${field} already exists`,
      });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteUserById = async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await userService.deleteUserById(userId);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Delete user successful" });
  } catch (err) {
    console.log(">>>>> SERVER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
};

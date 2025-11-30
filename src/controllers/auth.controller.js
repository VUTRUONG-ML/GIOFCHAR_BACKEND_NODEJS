const authService = require("../services/auth.service");
const userService = require("../services/user.service");

const registerApi = async (req, res) => {
  const { userName, email, phone, password } = req.body;
  if (!userName || !email || !phone || !password) {
    return res.status(400).json({ message: "Missing field" });
  }

  try {
    const result = await authService.register(userName, email, phone, password);

    res
      .status(201)
      .json({ message: "Register successful", userId: result.insertId });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);

    if (err.code === "ER_DUP_ENTRY") {
      let field = "";
      if (err.message.includes("email")) field = "email";
      else if (err.message.includes("phone")) field = "phone";

      return res.status(409).json({
        message: `${field} already exists`,
      });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const loginApi = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing field" });
  try {
    const result = await authService.login(email, password);

    res.status(200).json({ message: "Login successful", data: result });
  } catch (err) {
    console.error(">>>>> LOGIN ERROR:", err.message);
    const status = err.statusCode || 500;
    const message = status === 500 ? "Internal server error" : err.message;
    return res.status(status).json({ message });
  }
};

const getAccount = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await userService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  registerApi,
  loginApi,
  getAccount,
};

import authService from "../services/auth.service.js";
import cartService from "../services/cart.service.js";
import orderService from "../services/order.service.js";
import userService from "../services/user.service.js";

export const registerApi = async (req, res) => {
  const { userName, email, phone, password, address } = req.body;
  if (!userName || !email || !phone || !password) {
    return res.status(400).json({ message: "Missing field" });
  }
  const guestToken = req.headers["x-guest-token"];
  const orderId = req.headers["x-order-id"];
  try {
    const result = await authService.register(
      userName,
      email,
      phone,
      password,
      address,
    );

    if (guestToken) {
      try {
        await orderService.attachOrderToUser({
          guestToken,
          userId: result.insertId,
          orderId,
        });
        console.log(">>>>> Attach order to user success");
      } catch (error) {
        console.log(">>>>> Attach order failed", error);
      }
    }

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

export const loginApi = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing field" });
  const guestToken = req.headers["x-guest-token"];
  try {
    const result = await authService.login(email, password);

    let mergeStatus = true;
    if (guestToken) {
      try {
        await cartService.mergeGuestCartToUser({
          userId: result.user.id,
          guestToken,
        });
      } catch (error) {
        console.log(">>>>> Merge cart failed:", error.message);
        mergeStatus = false;
      }
    }

    res.status(200).json({
      message: "Login successful",
      data: { ...result, mergeCart: mergeStatus ? "success" : "failed" },
    });
  } catch (err) {
    console.error(">>>>> LOGIN ERROR:", err.message);
    const status = err.statusCode || 500;
    const message = status === 500 ? "Internal server error" : err.message;
    return res.status(status).json({ message });
  }
};

export const getAccount = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await userService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

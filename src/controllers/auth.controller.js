import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/AppError.js";
import { asyncHandler } from "../errors/errorHandler.js";
import authService from "../services/auth.service.js";
import cartService from "../services/cart.service.js";
import orderService from "../services/order.service.js";
import { refreshNewToken } from "../services/refreshToken.service.js";
import userService from "../services/user.service.js";

export const registerApi = asyncHandler(async (req, res) => {
  const { userName, email, phone, password, address } = req.body;
  if (!userName || !email || !phone || !password)
    throw new BadRequestError("Missing field");
  const guestToken = req.headers["x-guest-token"];

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
        email,
        userId: result.insertId,
      });
      console.log(">>>>> Attach order to user success");
    } catch (error) {
      console.log(">>>>> Attach order failed", error);
    }
  }

  return res
    .status(201)
    .json({ message: "Register successful", userId: result.insertId });
});

export const loginApi = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new BadRequestError("Missing field");
  const guestToken = req.headers["x-guest-token"];

  const result = await authService.login(email, password);
  const { refresh_token, ...loginInfo } = result;

  res.cookie("refreshToken", refresh_token, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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
    data: { ...loginInfo, mergeCart: mergeStatus ? "success" : "failed" },
  });
});

export const getAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const user = await userService.getUserById(userId);
  if (!user) throw new NotFoundError("User not found");
  return res.status(200).json(user);
});

export const refreshTokenController = async (req, res) => {
  const { refreshToken: oldToken } = req.cookies;
  if (!oldToken) {
    throw new UnauthorizedError("Missing refresh token");
  }
  const { accessToken, refreshToken } = await refreshNewToken(oldToken);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({ accessToken });
};

export const logoutController = async (req, res) => {
  const { refreshToken: oldToken } = req.cookies;
  try {
    if (oldToken) {
      await authService.logout(oldToken);
    }
  } catch (error) {
    // ignore
  }
  res.clearCookie("refreshToken");
  res.status(200).json({
    message: "Logout successful",
  });
};

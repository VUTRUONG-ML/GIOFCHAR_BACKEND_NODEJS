import pool from "../config/db.js";
import userService from "../services/user.service.js";
import { statusOverview } from "../utils/status.js";
import { asyncHandler } from "../errors/errorHandler.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";

const getAllUsers = async (req, res) => {
  const users = await userService.getAllUsersWithOrderCount();
  if (users.length === 0) {
    throw new NotFoundError("Empty Users list");
  }

  res.status(200).json({ totalUser: users.length, users });
};

const getUserById = async (req, res) => {
  const userId = req.params.userId;
  const user = await userService.getUserById(userId);

  res.status(200).json(user);
};

const createUser = async (req, res) => {
  const { userName, email, phone, address, password } = req.body;
  if (!userName || !email || !phone || !address || !password) {
    throw new BadRequestError("Missing field");
  }

  const result = await userService.createUser(
    userName,
    email,
    phone,
    address,
    password,
  );

  res
    .status(201)
    .json({ message: "Create user successful", userId: result.insertId });
};

const updateUserById = async (req, res) => {
  const userId = req.userId;
  const { userName, email, phone, address } = req.body;
  if (!userName || !email || !phone || !address) {
    throw new BadRequestError("Missing field");
  }

  await userService.updateUserById(userId, userName, email, phone, address);

  res.status(200).json({ message: "Update user successful" });
};

const updateUserByAdmin = async (req, res) => {
  const userId = req.params.userId;
  const { isActive } = req.body;

  await userService.updateActiveUserById(userId, isActive);

  res.status(200).json({ message: "Update isActive user successful" });
};

const deleteUserById = async (req, res) => {
  const userId = req.params.userId;

  await userService.deleteUserById(userId);

  res.status(200).json({ message: "Delete user successful" });
};

const getOverviewCountUser = async (req, res) => {
  const [countToday, countYesterday] = await Promise.all([
    userService.countUser(pool, "today"),
    userService.countUser(pool, "yesterday"),
  ]);
  const { status, percent } = statusOverview(countToday, countYesterday);

  return res.status(200).json({ countUser: countToday, status, percent });
};

export default {
  updateUserByAdmin: asyncHandler(updateUserByAdmin),
  getAllUsers: asyncHandler(getAllUsers),
  getUserById: asyncHandler(getUserById),
  createUser: asyncHandler(createUser),
  updateUserById: asyncHandler(updateUserById),
  deleteUserById: asyncHandler(deleteUserById),
  getOverviewCountUser: asyncHandler(getOverviewCountUser),
};

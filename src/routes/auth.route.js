import express from "express";
const router = express.Router();
import { requireAuth } from "../middlewares/auth.middleware.js";

import {
  getAccount,
  loginApi,
  refreshTokenController,
  registerApi,
} from "../controllers/auth.controller.js";
import { asyncHandler } from "../errors/errorHandler.js";

router.post("/refresh", asyncHandler(refreshTokenController));
router.get("/account", requireAuth, getAccount);
router.post("/login", loginApi);
router.post("/register", registerApi);

export default router;

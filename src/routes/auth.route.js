import express from "express";
const router = express.Router();
import { requireAuth } from "../middlewares/auth.middleware.js";

import {
  getAccount,
  loginApi,
  registerApi,
} from "../controllers/auth.controller.js";

router.get("/account", requireAuth, getAccount);
router.post("/login", loginApi);
router.post("/register", registerApi);

export default router;

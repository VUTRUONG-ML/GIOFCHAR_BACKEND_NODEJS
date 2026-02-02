import express from "express";
const router = express.Router();
import {
  validateInputMessage,
  detectUserMessage,
  handleIntent_goi_y_mon,
} from "../middlewares/ai.middleware.js";

import { handleIntentData } from "../controllers/ai.controller.js";

router.post(
  "/",
  validateInputMessage,
  detectUserMessage,
  handleIntent_goi_y_mon,
  handleIntentData,
);

export default router;

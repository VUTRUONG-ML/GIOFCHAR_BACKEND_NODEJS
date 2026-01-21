import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";
import { createPromotionController } from "../controllers/promotion.controller.js";
const router = express.Router();

router.post("/", requireAuth, checkAdmin, createPromotionController);

export default router;

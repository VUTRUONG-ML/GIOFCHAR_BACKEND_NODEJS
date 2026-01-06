import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";
import { getRevenue } from "../controllers/statistic.controller.js";

const router = express.Router();

router.get("/revenue", requireAuth, checkAdmin, getRevenue);

export default router;

import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";

router.delete(
  "/:userId",
  requireAuth,
  checkAdmin,
  userController.deleteUserById,
);
router.put(
  "/:userId",
  requireAuth,
  checkAdmin,
  userController.updateUserByAdmin,
);
router.put("/updateMyInfo", requireAuth, userController.updateUserById);
router.get(
  "/stats/overviewCount",
  requireAuth,
  checkAdmin,
  userController.getOverviewCountUser,
);
router.post("/", requireAuth, checkAdmin, userController.createUser);
router.get("/:userId", userController.getUserById);
router.get("/", requireAuth, checkAdmin, userController.getAllUsers);
export default router;

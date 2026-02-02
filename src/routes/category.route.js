import express from "express";
const router = express.Router();

import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";
import { checkAdmin } from "../middlewares/user.middleware.js";
import categoryController from "../controllers/category.controller.js";

router.delete(
  "/:categoryId",
  requireAuth,
  checkAdmin,
  categoryController.deleteCategoryById,
);
router.put(
  "/:categoryId",
  requireAuth,
  checkAdmin,
  categoryController.updateCategoryById,
);
router.post("/", requireAuth, checkAdmin, categoryController.createCategory);
router.get("/:categoryId", requireAuth, categoryController.getCategoryById);
router.get("/", optionalAuth, categoryController.getAllCategories);

export default router;

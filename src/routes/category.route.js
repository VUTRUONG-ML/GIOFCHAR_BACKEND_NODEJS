const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");
const categoryController = require("../controllers/category.controller");

router.delete(
  "/:categoryId",
  requireAuth,
  checkAdmin,
  categoryController.deleteCategoryById
);
router.put(
  "/:categoryId",
  requireAuth,
  checkAdmin,
  categoryController.updateCategoryById
);
router.get("/:categoryId", requireAuth, categoryController.getCategoryById);
router.post("/", requireAuth, checkAdmin, categoryController.createCategory);
router.get("/", requireAuth, categoryController.getAllCategories);

module.exports = router;

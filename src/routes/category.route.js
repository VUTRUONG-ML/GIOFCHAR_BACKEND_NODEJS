const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");
const categoryController = require("../controllers/category.controller");

router.delete(
  "/:categoryId",
  verifyToken,
  checkAdmin,
  categoryController.deleteCategoryById
);
router.put(
  "/:categoryId",
  verifyToken,
  checkAdmin,
  categoryController.updateCategoryById
);
router.get("/:categoryId", verifyToken, categoryController.getCategoryById);
router.post("/", verifyToken, checkAdmin, categoryController.createCategory);
router.get("/", verifyToken, categoryController.getAllCategories);

module.exports = router;

const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");

router.delete("/:categoryId", categoryController.deleteCategoryById);
router.put("/:categoryId", categoryController.updateCategoryById);
router.get("/:categoryId", categoryController.getCategoryById);
router.post("/", categoryController.createCategory);
router.get("/", categoryController.getAllCategories);

module.exports = router;

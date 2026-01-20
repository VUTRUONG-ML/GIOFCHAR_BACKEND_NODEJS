const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const {
  uploadToCloudinary,
  cleanupCloudinary,
} = require("../middlewares/cloudinary.middleware");
const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");

const foodController = require("../controllers/food.controller");
const checkCategory = require("../middlewares/checkCategory");
const checkFood = require("../middlewares/checkFood");

router.delete(
  "/:foodId",
  requireAuth,
  checkAdmin,
  checkFood,
  foodController.deleteFoodById, // delete food
);
router.put(
  "/:foodId",
  requireAuth,
  checkAdmin,

  upload.single("imageFood"),
  uploadToCloudinary,
  cleanupCloudinary,

  checkFood,
  checkCategory,
  foodController.updateFoodById,
);
router.post(
  "/",
  requireAuth,
  checkAdmin,
  upload.single("imageFood"),
  uploadToCloudinary,
  cleanupCloudinary, // xóa ảnh nếu có lỗi xảy ra khi res.json() ở 2 controller sau

  checkCategory,
  foodController.createFood,
);
router.get("/promotion", foodController.getFoodsPromotion);
router.get("/best-selling", foodController.getAllBestSelling);
router.get("/:foodId", optionalAuth, foodController.getDetailFood);
router.get("/", optionalAuth, foodController.getAllFoods);

module.exports = router;

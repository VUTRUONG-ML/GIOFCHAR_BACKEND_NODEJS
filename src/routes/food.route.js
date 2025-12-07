const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  cleanupCloudinary,
} = require("../middlewares/cloudinary.middleware");
const { verifyToken } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");

const foodController = require("../controllers/food.controller");
const checkCategory = require("../middlewares/checkCategory");
const checkFood = require("../middlewares/checkFood");

router.get(
  "/foodsAdmin",
  verifyToken,
  checkAdmin,
  foodController.getAllFoodsAdmin
); // admin xem

router.delete(
  "/:foodId",
  verifyToken,
  checkAdmin,
  checkFood,
  deleteFromCloudinary, // delete image on cloudinary
  foodController.deleteFoodById // delete food
);
router.put(
  "/:foodId",
  verifyToken,
  checkAdmin,
  checkCategory,
  foodController.updateFoodById
);
router.get("/:foodId", verifyToken, foodController.getFoodById);
router.post(
  "/",
  verifyToken,
  checkAdmin,
  upload.single("imageFood"),
  uploadToCloudinary,
  cleanupCloudinary, // xóa ảnh nếu có lỗi xảy ra khi res.json() ở 2 controller sau

  checkCategory,
  foodController.createFood
);
router.get("/", verifyToken, foodController.getAllFoods); // client xem

module.exports = router;

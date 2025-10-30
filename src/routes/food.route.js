const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { checkAdmin } = require("../middlewares/user.middleware");

const foodController = require("../controllers/food.controller");
const checkCategory = require("../middlewares/checkCategory");

router.delete(
  "/:foodId",
  verifyToken,
  checkAdmin,
  foodController.deleteFoodById
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
  checkCategory,
  foodController.createFood
);
router.get("/", verifyToken, foodController.getAllFoods);
module.exports = router;

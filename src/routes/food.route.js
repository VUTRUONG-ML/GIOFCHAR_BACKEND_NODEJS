const express = require("express");
const router = express.Router();
const foodController = require("../controllers/food.controller");
const checkCategory = require("../middlewares/checkCategory");

router.delete("/:foodId", foodController.deleteFoodById);
router.put("/:foodId", checkCategory, foodController.updateFoodById);
router.get("/:foodId", foodController.getFoodById);
router.post("/", checkCategory, foodController.createFood);
router.get("/", foodController.getAllFoods);
module.exports = router;

const express = require("express");
const router = express.Router();
const foodController = require("../controllers/food.controller");

router.delete("/:foodId", foodController.deleteFoodById);
router.put("/:foodId", foodController.updateFoodById);
router.get("/:foodId", foodController.getFoodById);
router.post("/", foodController.createFood);
router.get("/", foodController.getAllFoods);
module.exports = router;

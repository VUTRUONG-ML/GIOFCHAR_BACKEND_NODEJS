import pool from "../config/db.js";
import foodService from "../services/food.service.js";
import { asyncHandler } from "../errors/errorHandler.js";

export const checkFoodExists = asyncHandler(async (req, res, next) => {
  const foodId = req.body.foodId || req.params.foodId;

  if (!foodId) {
    return res.status(400).json({ message: "Missing foodId" });
  }

  const food = await foodService.getFoodById(foodId, pool);

  if (!food) return res.status(404).json({ message: "Food not found" });
  req.food = food;
  return next();
});

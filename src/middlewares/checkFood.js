import pool from "../config/db.js";
import foodService from "../services/food.service.js";

export const checkFoodExists = async (req, res, next) => {
  const foodId = req.body.foodId || req.params.foodId;

  if (!foodId) {
    return res.status(400).json({ message: "Missing foodId" });
  }

  try {
    const food = await foodService.getFoodById(foodId, { isAdmin: true }, pool);

    if (!food) return res.status(404).json({ message: "Food not found" });
    req.food = food;
    next();
  } catch (err) {
    console.error(">>>>> MIDDLEWARE ERROR:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

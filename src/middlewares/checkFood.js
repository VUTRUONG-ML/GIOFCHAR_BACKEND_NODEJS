const foodService = require("../services/food.service");

const checkFoodExists = async (req, res, next) => {
  const foodId = req.body.foodId || req.params.foodId;

  if (!foodId) {
    return res.status(400).json({ message: "Missing foodId" });
  }

  try {
    const foods = await foodService.getFoodById(foodId);

    if (!foods.length)
      return res.status(404).json({ message: "Food not found" });
    next(); // Cho phép đi tiếp nếu category tồn tại
  } catch (err) {
    console.error(">>>>> MIDDLEWARE ERROR:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

module.exports = checkFoodExists;

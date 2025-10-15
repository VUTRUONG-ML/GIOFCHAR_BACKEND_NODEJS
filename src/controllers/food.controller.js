const foodService = require("../services/food.service");

const getAllFoods = async (req, res) => {
  try {
    const foods = await foodService.getAllFoods();

    if (!foods.length)
      return res.status(404).json({ message: "Empty Foods list" });

    res.status(200).json(foods);
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createFood = async (req, res) => {
  const {
    foodName,
    foodDescription,
    ingredients,
    price,
    discount,
    rating,
    stock,
    isActive,
    categoryID,
    image,
  } = req.body;

  if (!foodName || !foodDescription || !price || !categoryID)
    return res.status(400).json({ message: "Missing field" });

  try {
    const result = await foodService.createFood(
      foodName,
      foodDescription,
      ingredients,
      price,
      discount,
      rating,
      stock,
      isActive,
      categoryID,
      image
    );

    res
      .status(201)
      .json({ message: "Create food successful", foodId: result.insertId });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);

    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Food name already exists" });

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getFoodById = async (req, res) => {
  const foodId = req.params.foodId;
  try {
    const foods = await foodService.getFoodById(foodId);
    if (!foods.length)
      return res.status(404).json({ message: "Food not found" });

    res.status(200).json(foods);
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateFoodById = async (req, res) => {
  const foodId = req.params.foodId;
  const {
    foodName,
    foodDescription,
    ingredients,
    price,
    discount,
    rating,
    stock,
    isActive,
    categoryID,
    image,
  } = req.body;

  if (!foodName || !foodDescription || !price || !categoryID)
    return res.status(400).json({ message: "Missing field" });

  try {
    const result = await foodService.updateFoodById(
      foodName,
      foodDescription,
      ingredients,
      price,
      discount,
      rating,
      stock,
      isActive,
      categoryID,
      image,
      foodId
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Food not found" });

    res.status(200).json({ message: "Update food successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);

    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Food name already exists" });

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteFoodById = async (req, res) => {
  const foodId = req.params.foodId;

  try {
    const result = await foodService.deleteFoodById(foodId);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Food not found" });

    res.status(200).json({ message: "Delete food successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllFoods,
  createFood,
  getFoodById,
  updateFoodById,
  deleteFoodById,
};

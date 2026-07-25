import pool from "../config/db.js";
import { asyncHandler } from "../errors/errorHandler.js";
import foodService from "../services/food.service.js";
import { safeDeleteCloudinary } from "../utils/safeCloudinary.js";

const getAllFoods = asyncHandler(async (req, res) => {
  const { role } = req.user;
  const { search } = req.query;

  let foods;

  if (role === "admin") {
    foods = await foodService.getAllFoodsAdmin();
  } else {
    if (!search) foods = await foodService.getAllFoods();
    else foods = await foodService.searchFood((key = search));
  }

  return res.status(200).json({ quantity: foods.length, foods });
});

const getAllBestSelling = asyncHandler(async (req, res) => {
  const foods = await foodService.getBestSellingFoods();
  return res.status(200).json({ quantity: foods.length, foods });
});

const getFoodsPromotion = asyncHandler(async (req, res) => {
  const foods = await foodService.getPromotionFoods();
  return res.status(200).json({ quantity: foods.length, foods });
});

const createFood = asyncHandler(async (req, res) => {
  const {
    foodName,
    foodDescription,
    ingredients,
    rating,
    isActive,
    categoryID,
  } = req.body;
  const ingredientsValue = JSON.parse(ingredients);

  const imageUrl = req.cloudinaryImage?.secure_url || null;
  const imagePublicId = req.cloudinaryImage?.public_id || null;
  if (!foodName || !foodDescription || categoryID === undefined) {
    return res.status(400).json({ message: "Missing field" });
  }

  const isActiveValue =
    isActive === undefined
      ? 1
      : isActive === true || isActive === "true" || isActive === "1"
        ? 1
        : 0;

  try {
    const result = await foodService.createFood(
      foodName,
      foodDescription,
      ingredientsValue,
      rating,
      isActiveValue,
      categoryID,
      imageUrl,
      imagePublicId,
    );

    res
      .status(201)
      .json({ message: "Create food successful", foodId: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Food name already exists" });

    throw err;
  }
});

const getFoodById = asyncHandler(async (req, res) => {
  const foodId = req.params.foodId;
  const { role } = req.user;
  const food = await foodService.getFoodById(foodId);

  if (!food) return res.status(404).json({ message: "Food not found" });

  res.status(200).json(food);
});

const getDetailFood = asyncHandler(async (req, res) => {
  const foodId = req.params.foodId;
  const food = await foodService.getDetailFood(foodId);
  if (!food) return res.status(404).json({ message: "Food not found" });
  return res.status(200).json(food);
});

const updateFoodById = asyncHandler(async (req, res) => {
  const foodId = req.params.foodId;
  const {
    foodName,
    foodDescription,
    ingredients,
    rating,
    isActive,
    categoryID,
  } = req.body;

  let image = req.food?.image; // img cũ
  let imagePublicId = req.food?.imagePublicId; // imagePublicId cũ
  let oldPublicId = req.food?.imagePublicId; // lưu lại để xóa

  if (req.cloudinaryImage) {
    // nếu tồn tại ảnh mà người dùng up lên có nghĩa là ảnh mới
    image = req.cloudinaryImage?.secure_url || null;
    imagePublicId = req.cloudinaryImage?.public_id || null;
  }

  if (!foodName || !foodDescription || categoryID == null) {
    return res.status(400).json({ message: "Missing field" });
  }

  const isActiveValue =
    isActive === undefined
      ? 1
      : isActive === true || isActive === "true" || isActive === "1"
        ? 1
        : 0;

  const ingredientsValue = JSON.parse(ingredients);
  try {
    const result = await foodService.updateFoodById(
      foodName,
      foodDescription,
      ingredientsValue,
      rating,
      isActiveValue,
      categoryID,
      image,
      imagePublicId,
      foodId,
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Food not found" });

    if (req.cloudinaryImage && oldPublicId) {
      // sau khi update xong nếu tồn tại cloudinaryImage thì có nghĩa là người dùng đã up ảnh mới cần phải xóa publicId cũ
      await safeDeleteCloudinary(oldPublicId);
    }

    res.status(200).json({ message: "Update food successful" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Food name already exists" });

    throw err;
  }
});

const deleteFoodById = asyncHandler(async (req, res) => {
  const foodId = req.params.foodId;
  const publicId = req.food?.imagePublicId;
  try {
    const result = await foodService.deleteFoodById(foodId);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Food not found" });

    if (publicId) {
      await safeDeleteCloudinary(publicId);
    }
    res.status(200).json({ message: "Delete food successful" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(400)
        .json({ message: "The food has been used in the order" });
    }
    throw err;
  }
});

export default {
  getAllFoods,
  createFood,
  getFoodById,
  updateFoodById,
  deleteFoodById,
  getAllBestSelling,
  getFoodsPromotion,
  getDetailFood,
};

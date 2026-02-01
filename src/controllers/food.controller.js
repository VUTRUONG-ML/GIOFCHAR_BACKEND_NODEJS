import pool from "../config/db.js";
import foodService from "../services/food.service.js";
import safeDeleteCloudinary from "../utils/safeCloudinary.js";

const getAllFoods = async (req, res) => {
  const { role } = req.user;
  const { search } = req.query;
  try {
    let foods;

    if (role === "admin") {
      foods = await foodService.getAllFoodsAdmin();
    } else {
      if (!search) foods = await foodService.getAllFoods({});
      else foods = await foodService.searchFood((key = search));
    }

    res.status(200).json({ quantity: foods.length, foods });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getAllBestSelling = async (req, res) => {
  try {
    const foods = await foodService.getAllFoods({ option: "bestSelling" });
    return res.status(200).json({ quantity: foods.length, foods });
  } catch (error) {
    console.log(">>>>> CONTROLLER ERROR", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getFoodsPromotion = async (req, res) => {
  try {
    const foods = await foodService.getAllFoods({ option: "promotion" });
    return res.status(200).json({ quantity: foods.length, foods });
  } catch (error) {
    console.log(">>>>> CONTROLLER ERROR", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createFood = async (req, res) => {
  const {
    foodName,
    foodDescription,
    ingredients,
    originalPrice,
    discount,
    rating,
    stock,
    isActive,
    categoryID,
  } = req.body;

  const imageUrl = req.cloudinaryImage?.secure_url || null;
  const imagePublicId = req.cloudinaryImage?.public_id || null;
  if (
    !foodName ||
    !foodDescription ||
    originalPrice === undefined ||
    categoryID === undefined ||
    stock === undefined
  ) {
    return res.status(400).json({ message: "Missing field" });
  }

  if (Number.isNaN(Number(originalPrice))) {
    return res.status(400).json({ message: "originalPrice must be a number" });
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
      ingredients,
      Number(originalPrice),
      discount,
      rating,
      stock,
      isActiveValue,
      categoryID,
      imageUrl,
      imagePublicId,
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
  const { role } = req.user;
  try {
    let food;
    if (role === "admin") {
      food = await foodService.getFoodById(foodId, { isAdmin: true });
    } else {
      food = await foodService.getFoodById(foodId, {});
    }
    if (!food) return res.status(404).json({ message: "Food not found" });

    res.status(200).json(food);
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getDetailFood = async (req, res) => {
  const foodId = req.params.foodId;
  try {
    const food = await foodService.getDetailFood(foodId);
    if (!food) return res.status(404).json({ message: "Food not found" });
    return res.status(200).json(food);
  } catch (error) {
    console.log(">>> CONTROLLER get detail food ERROR:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const updateFoodById = async (req, res) => {
  const foodId = req.params.foodId;
  const {
    foodName,
    foodDescription,
    originalPrice,
    discount,
    rating,
    stock,
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

  if (
    !foodName ||
    !foodDescription ||
    originalPrice == null ||
    categoryID == null
  ) {
    return res.status(400).json({ message: "Missing field" });
  }

  if (Number.isNaN(Number(originalPrice))) {
    return res.status(400).json({ message: "originalPrice must be a number" });
  }

  const isActiveValue =
    isActive === undefined
      ? 1
      : isActive === true || isActive === "true" || isActive === "1"
        ? 1
        : 0;

  try {
    const result = await foodService.updateFoodById(
      foodName,
      foodDescription,
      originalPrice,
      discount,
      rating,
      stock,
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
    console.log(">>>>> CONTROLLER ERROR", err.message);

    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Food name already exists" });

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteFoodById = async (req, res) => {
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
    console.log(">>>>> CONTROLLER ERROR", err.message);
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(400)
        .json({ message: "The food has been used in the order" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

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

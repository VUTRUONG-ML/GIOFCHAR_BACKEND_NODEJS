const foodService = require("../services/food.service");
const safeDeleteCloudinary = require("../utils/safeCloudinary");
const getAllFoodsAdmin = async (req, res) => {
  try {
    const foods = await foodService.getAllFoodsAdmin();

    res.status(200).json({ quantity: foods.length, foods });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
const getAllFoods = async (req, res) => {
  try {
    const foods = await foodService.getAllFoods();

    if (!foods.length)
      return res.status(404).json({ message: "Empty Foods list" });

    res.status(200).json({ quantity: foods.length, foods });
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
  } = req.body;

  const imageUrl = req.cloudinaryImage?.secure_url || null;
  const imagePublicId = req.cloudinaryImage?.public_id || null;
  if (!foodName || !foodDescription || !price || !categoryID || !stock) {
    return res.status(400).json({ message: "Missing field" });
  }

  const isActiveValue =
    isActive === true || isActive === "true"
      ? 1
      : isActive === false || isActive === "false"
      ? 0
      : 1;

  try {
    const result = await foodService.createFood(
      foodName,
      foodDescription,
      ingredients,
      price,
      discount,
      rating,
      stock,
      isActiveValue,
      categoryID,
      imageUrl,
      imagePublicId
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
    if (!foods) return res.status(404).json({ message: "Food not found" });

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
    price,
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

  if (!foodName || !foodDescription || !price || !categoryID)
    return res.status(400).json({ message: "Missing field" });

  const isActiveValue =
    isActive === true || isActive === "true" || isActive === "1"
      ? 1
      : isActive === false || isActive === "false" || isActive === "0"
      ? 0
      : 1;
  try {
    const result = await foodService.updateFoodById(
      foodName,
      foodDescription,
      price,
      discount,
      rating,
      stock,
      isActiveValue,
      categoryID,
      image,
      imagePublicId,
      foodId
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

module.exports = {
  getAllFoods,
  getAllFoodsAdmin,
  createFood,
  getFoodById,
  updateFoodById,
  deleteFoodById,
};

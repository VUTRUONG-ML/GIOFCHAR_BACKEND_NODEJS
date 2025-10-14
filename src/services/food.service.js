const pool = require("../config/db");

const getAllFoods = async () => {
  try {
    // For pool initialization, see above
    const [foods] = await pool.execute("SELECT * FROM foods");
    return foods;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const createFood = async (
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
) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO foods (
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
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
      [
        foodName,
        foodDescription,
        ingredients || "",
        price,
        discount ?? 0,
        rating ?? 0,
        stock ?? 0,
        isActive ?? true,
        categoryID,
        image || "",
      ]
    );

    return { insertId: result.insertId };
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const getFoodById = async (foodId) => {
  try {
    // For pool initialization, see above
    const [foods] = await pool.execute("SELECT * FROM foods WHERE id = ?", [
      foodId,
    ]);
    return foods;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const updateFoodById = async (
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
) => {
  try {
    const [result] = await pool.execute(
      `UPDATE foods 
            SET foodName = ?,foodDescription = ?,ingredients = ?,price = ?,discount = ?,rating = ?,stock = ?,isActive = ?,categoryID = ?,image = ?
            WHERE id = ?`,
      [
        foodName,
        foodDescription,
        ingredients || "",
        price,
        discount ?? 0,
        rating ?? 0,
        stock ?? 0,
        isActive ?? true,
        categoryID,
        image || "",
        foodId,
      ]
    );

    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const deleteFoodById = async (foodId) => {
  try {
    // For pool initialization, see above
    const [result] = await pool.execute("DELETE FROM foods WHERE id = ?", [
      foodId,
    ]);
    return result;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

module.exports = {
  getAllFoods,
  createFood,
  getFoodById,
  updateFoodById,
  deleteFoodById,
};

import pool from "../config/db.js";
import { buildPreview } from "../utils/food.js";
import { normalizeVN } from "../utils/normalize.js";
import { getVariantByFoodId } from "./variant.service.js";

const getAllFoodsAdmin = async () => {
  try {
    // For pool initialization, see above
    const [foods] = await pool.execute(`
      SELECT 
        f.id as foodId,
        foodName, 
        foodDescription,
        isActive,
        image,
        rating,
        ingredients,
        f.categoryID,
        
        c.categoryName
      FROM foods f
      JOIN categories c ON f.categoryID = c.id`);
    return foods;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const getAllFoods = async ({ option = "default" }, conn = pool) => {
  // const typeOption = "default" | "bestSelling" | "promotion";
  let optionGet;
  switch (option) {
    case "bestSelling":
      optionGet = `
        JOIN order_items oi ON f.id = oi.foodID
        WHERE f.stock > 0
        GROUP BY f.id
        ORDER BY SUM(oi.quantity) DESC
        `;
      break;
    case "promotion":
      optionGet = `
        JOIN order_items oi ON f.id = oi.foodID
        WHERE f.stock > 0
        GROUP BY f.id
        ORDER BY f.discount DESC, SUM(oi.quantity) DESC
        `;
      break;
    default:
      optionGet = "";
      break;
  }
  try {
    const [rows] = await conn.execute(`
      SELECT
        f.id           AS foodId,
        f.foodName,
        f.image,
        f.rating,
        f.categoryID,
        c.categoryName,

        fv.id          AS variantId,
        fv.weight_gram,
        fv.originalPrice,

        p.id           AS promotionId,
        p.type         AS promotionType,
        p.value        AS promotionValue,
        p.start_at,
        p.end_at,
        p.isActive
      FROM foods f
      JOIN categories c ON f.categoryID = c.id
      LEFT JOIN food_variants fv ON fv.foodID = f.id
      LEFT JOIN promotion_targets pt ON pt.food_variantID = fv.id
      LEFT JOIN promotions p ON p.id = pt.promotionID
        AND p.isActive = TRUE
        AND NOW() BETWEEN p.start_at AND p.end_at
      ORDER BY f.id, fv.weight_gram;
    `);
    const newRows = buildPreview(rows);
    return newRows;
  } catch (err) {
    console.log(">>>>> Service getAllFoods error", err);
    throw err;
  }
};

const createFood = async (
  foodName,
  foodDescription,
  ingredients,
  rating,
  isActive,
  categoryID,
  image,
  imagePublicId,
) => {
  try {
    const sql = `
      INSERT INTO foods (
            foodName,
            foodDescription,
            ingredients,
            rating,
            isActive,
            categoryID,
            image,
            imagePublicId
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?
        )
    `;
    const values = [
      foodName,
      foodDescription,
      ingredients || [
        "Thịt heo tươi",
        "Da heo",
        "Lá chuối",
        "Gia vị truyền thống",
      ],
      rating ?? 0,
      isActive ?? true,
      categoryID,
      image || "",
      imagePublicId || "",
    ];
    const [result] = await pool.execute(sql, values);

    return { insertId: result.insertId };
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const getFoodById = async (foodId, { isAdmin = false }, conn = pool) => {
  // const field = isAdmin
  //   ? "stock, imagePublicId, discount,"
  //   : "discount, rating, ingredients,";
  try {
    // For pool initialization, see above
    const [foods] = await conn.execute(
      `SELECT 
        f.id as foodId,
        f.foodName,
        f.foodDescription,
        f.image,
        f.rating,
        f.ingredients,
        f.categoryID,
        c.categoryName
      FROM foods f
      JOIN categories c ON f.categoryID = c.id
      WHERE f.id = ?`,
      [foodId],
    );
    return foods.length > 0 ? foods[0] : null;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const updateFoodById = async (
  foodName,
  foodDescription,
  originalPrice,
  discount,
  rating,
  stock,
  isActive,
  categoryID,
  image,
  imagePublicId,
  foodId,
) => {
  try {
    const finalDiscount = discount ?? 0;
    if (finalDiscount < 0 || finalDiscount > 100) {
      throw new Error("Discount must be between 0 and 100");
    }

    const price = Number(
      ((originalPrice * (100 - finalDiscount)) / 100).toFixed(2),
    );

    const [result] = await pool.execute(
      `UPDATE foods 
       SET 
         foodName = ?,
         foodDescription = ?,
         originalPrice = ?,
         price = ?,
         discount = ?,
         rating = ?,
         stock = ?,
         isActive = ?,
         categoryID = ?,
         image = ?,
         imagePublicId = ?
       WHERE id = ?`,
      [
        foodName,
        foodDescription,
        originalPrice,
        price,
        finalDiscount,
        rating ?? 0,
        stock ?? 0,
        isActive ?? true,
        categoryID,
        image || "",
        imagePublicId || "",
        foodId,
      ],
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

const searchFood = async (key = "") => {
  const normalizedKeyword = normalizeVN(key);
  try {
    const [result] = await pool.execute(
      `
      SELECT 
       f.id as foodId,
        foodName, 
        price,
        originalPrice,
        discount,
        rating,
        isActive,
        image,
        f.categoryID,
        
        c.categoryName
      FROM foods f
      JOIN categories c ON f.categoryID = c.id 
      WHERE f.isActive = 1
            AND f.stock > 0`,
    );
    if (!normalizedKeyword) return result;
    return result.filter((row) => {
      return (
        normalizeVN(row.foodName).includes(normalizedKeyword) ||
        normalizeVN(row.foodDescription || "").includes(normalizedKeyword)
      );
    });
  } catch (error) {
    console.log(">>>>> SERVICE ERROR", error.message);
    throw error;
  }
};

const filterFood = async (preference, budget, quantity) => {
  try {
    const [foods] = await pool.execute(
      `
      SELECT
        f.id as foodId,
        f.foodName,
        f.price,
        f.image
      FROM foods f
      JOIN categories c ON f.categoryID = c.id
      WHERE f.isActive = TRUE
        AND (f.foodName LIKE CONCAT("%", ?, "%") OR c.categoryName LIKE CONCAT("%", ?, "%"))
        AND f.price <= ?
        AND f.stock >= ?
      ORDER BY f.price ASC;
    `,
      [preference, preference, budget, quantity],
    );
    return foods.length > 0 ? foods : null;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR:", error.message);
    throw error;
  }
};

const getStock = async (conn, foodId, { forUpdate = false }) => {
  try {
    const isLock = forUpdate ? "FOR UPDATE" : "";
    const [result] = await conn.execute(
      `SELECT stock FROM foods WHERE id = ? ${isLock}`,
      [foodId],
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR get stock:", error.message);
    throw error;
  }
};

const getDetailFood = async (foodId) => {
  const connection = await pool.getConnection();
  try {
    const food = await getFoodById(foodId, {}, connection);
    if (!food) {
      return null;
    }
    const variants = await getVariantByFoodId(foodId, connection);
    const newFood = { ...food, variants };
    return newFood;
  } catch (error) {
    console.log(">>> SERVICE get detail food ERROR:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
export default {
  getAllFoods,
  getAllFoodsAdmin,
  createFood,
  getFoodById,
  updateFoodById,
  deleteFoodById,
  searchFood,
  filterFood,
  getStock,
  getDetailFood,
};

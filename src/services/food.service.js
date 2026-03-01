import pool from "../config/db.js";
import { buildPreview } from "../utils/food.js";
import { normalizeVN } from "../utils/normalize.js";
import { getPriceRange } from "../utils/variant.js";
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

const getAllFoods = async (conn = pool) => {
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
      WHERE f.isActive = true
      ORDER BY f.id, fv.weight_gram;
    `);
    const newRows = buildPreview(rows);
    return newRows;
  } catch (err) {
    console.log(">>>>> Service getAllFoods error", err);
    throw err;
  }
};
const limitRow = 8;
const getBestSellingFoods = async (conn = pool) => {
  try {
    const sql = `   
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
            
            fs.totalSold
        FROM (
          SELECT 
          fv.foodID,
          SUM(oi.quantity) as totalSold
        FROM food_variants fv 
        JOIN order_items oi ON fv.id = oi.food_variantID 
        GROUP BY fv.foodID
        ORDER BY totalSold DESC
        LIMIT ${limitRow}) fs 
        JOIN foods f ON f.id = fs.foodID
        JOIN categories c ON f.categoryID = c.id
        LEFT JOIN food_variants fv ON fv.foodID = f.id AND fv.isActive = TRUE
        LEFT JOIN promotion_targets pt ON pt.food_variantID = fv.id
        LEFT JOIN promotions p ON p.id = pt.promotionID
          AND p.isActive = TRUE
          AND NOW() BETWEEN p.start_at AND p.end_at
        WHERE f.isActive = TRUE
        ORDER BY fs.totalSold DESC
    `;
    const [rows] = await conn.execute(sql);
    const bestSelling = buildPreview(rows);
    return bestSelling;
  } catch (error) {
    throw error;
  }
};
const getPromotionFoods = async (conn = pool) => {
  try {
    const sql = `
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
        p.value        AS promotionValue

      FROM foods f
      JOIN categories c ON f.categoryID = c.id
      LEFT JOIN food_variants fv ON fv.foodID = f.id AND fv.isActive = TRUE
      LEFT JOIN promotion_targets pt ON pt.food_variantID = fv.id
      LEFT JOIN promotions p ON p.id = pt.promotionID
        AND p.isActive = TRUE
        AND NOW() BETWEEN p.start_at AND p.end_at
      WHERE f.isActive = TRUE
        AND EXISTS (
          SELECT 1
          FROM food_variants fv2
          JOIN promotion_targets pt2 ON pt2.food_variantID = fv2.id
          JOIN promotions p2 ON p2.id = pt2.promotionID
          WHERE fv2.foodID = f.id
            AND fv2.isActive = TRUE
            AND p2.isActive = TRUE
            AND NOW() BETWEEN p2.start_at AND p2.end_at
          )
    `; // trước WHERE thì  query lấy ra toàn bộ danh sách food đang giảm giá hoặc không, sau khi áp dụng WHERE thì nó sẽ lọc theo điều kiện ràng buộc EXISTS chắc chắn phải có ít nhất 1 variant giảm giá
    const [rows] = await conn.execute(sql);
    const onSale = buildPreview(rows);
    return onSale;
  } catch (error) {
    throw error;
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

const getFoodById = async (foodId, conn = pool) => {
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
  ingredients,
  rating,
  isActive,
  categoryID,
  image,
  imagePublicId,
  foodId,
) => {
  try {
    const sql = `
      UPDATE foods 
       SET
         foodName = ?,
         foodDescription = ?,
         ingredients = ?,
         rating = ?,
         isActive = ?,
         categoryID = ?,
         image = ?,
         imagePublicId = ?
       WHERE id = ?
    `;
    const values = [
      foodName,
      foodDescription,
      ingredients ?? [],
      rating ?? 0,
      isActive ?? true,
      categoryID,
      image || "",
      imagePublicId || "",
      foodId,
    ];
    const [result] = await pool.execute(sql, values);

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
    const food = await getFoodById(foodId, connection);
    if (!food) {
      return null;
    }
    const variants = await getVariantByFoodId(foodId, false, connection);
    const priceRange = getPriceRange(variants);
    const newFood = { ...food, variants, ...priceRange };
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
  getBestSellingFoods,
  getPromotionFoods,
};

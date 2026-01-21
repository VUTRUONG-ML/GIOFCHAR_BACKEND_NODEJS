import pool from "../config/db.js";
import { groupVariant } from "../utils/variant.js";

export async function getVariantByFoodId(foodId, conn = pool) {
  try {
    const sql = `
        SELECT
            fv.id as variantId,
            fv.weight_gram,
            fv.originalPrice,
            fv.stock as inStock,
            p.type as typePromotion,
            p.value as valuePromotion
        FROM food_variants fv 
        LEFT JOIN promotion_targets pt ON pt.food_variantID = fv.id 
        LEFT JOIN promotions p ON p.id = pt.promotionID 
            AND NOW() BETWEEN p.start_at AND p.end_at 
            AND p.isActive = TRUE
        WHERE fv.foodID = ? AND fv.isActive = TRUE
        ORDER BY fv.weight_gram 
    `;
    const [rows] = await conn.execute(sql, [foodId]);
    const res = groupVariant(rows);
    return res;
  } catch (error) {
    console.log(">>> SERVICE ERROR:", error.message);
    throw error;
  }
}

export async function createVariant(
  { foodId, weight_gram, originalPrice, stock = 0 },
  conn = pool,
) {
  const sql = `INSERT INTO food_variants (foodID, weight_gram, originalPrice, stock)
     VALUES (?, ?, ?, ?)`;
  const values = [foodId, weight_gram, originalPrice, stock];
  try {
    const [result] = await conn.execute(sql, values);
    return result.insertId;
  } catch (error) {
    console.log(">>> SERVICE create variant ERROR:", error.message);
    throw error;
  }
}

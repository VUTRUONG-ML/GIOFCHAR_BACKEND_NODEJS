import pool from "../config/db.js";
import { attachVariantToFood } from "../utils/food.js";
import { groupVariant } from "../utils/variant.js";
import foodService from "./food.service.js";

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
    console.log(">> res:", res);
    return res;
  } catch (error) {
    console.log(">>> SERVICE ERROR:", error.message);
    throw error;
  }
}

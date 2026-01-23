import pool from "../config/db.js";
import { groupVariant } from "../utils/variant.js";
import { validateVariant } from "./validators.js";
import {
  createPromotionTarget,
  getPromotionById,
} from "./promotion.service.js";
import { BadRequestError, ConflictError } from "../errors/AppError.js";

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
    `; // Nếu bỏ AND NOW() BETWEEN p.start_at AND p.end_at và AND p.isActive = TRUE xuống dưới where thì nó sẽ không khớp đk where nên nó sẽ bỏ các dòng mà promotion null
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
  validateVariant({ weight_gram, originalPrice, stock });
  const sql = `INSERT INTO food_variants (foodID, weight_gram, originalPrice, stock)
     VALUES (?, ?, ?, ?)`;
  const values = [foodId, weight_gram, originalPrice, stock];
  try {
    const [result] = await conn.execute(sql, values);
    return result.insertId;
  } catch (error) {
    console.log(">>> SERVICE create variant ERROR:", error.message);
    if (error.code === "ER_DUP_ENTRY")
      throw new ConflictError("Weight gram already exists on food");
    throw error;
  }
}

export async function getVariantById(variantId, conn = pool) {
  try {
    const sql = `
      SELECT
        fv.id as variantId,
        fv.weight_gram,
        fv.originalPrice,
        fv.stock as inStock
      FROM food_variants fv 
      WHERE fv.id = ? AND fv.isActive = TRUE
      ORDER BY fv.weight_gram 
    `;
    const [rows] = await conn.execute(sql, [variantId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log(">>> SERVICE getVariantById ERROR:", error.message);
    throw error;
  }
}

export async function createVariantWithPromotion({
  foodId,
  weight_gram,
  originalPrice,
  stock,
  promotionId = null,
}) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Tạo variant
    const variantId = await createVariant(
      { foodId, weight_gram, originalPrice, stock },
      conn,
    );

    // 2. Nếu có promotion thì gán promotion cho variant
    if (promotionId) {
      const promotion = await getPromotionById(promotionId, conn);
      if (!promotion) throw new BadRequestError("Promotion not found");
      await createPromotionTarget({ promotionId, variantId }, conn);
    }

    await conn.commit();
    return variantId;
  } catch (error) {
    await conn.rollback();
    console.log(">>> SERVICE createVariantWithPromotion ERROR:", error.message);
    throw error;
  } finally {
    conn.release();
  }
}

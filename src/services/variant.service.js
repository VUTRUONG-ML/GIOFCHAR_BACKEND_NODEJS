import pool from "../config/db.js";
import { groupVariant } from "../utils/variant.js";
import { validateVariant } from "./validators.js";
import {
  createPromotionTarget,
  deletePromotionTarget,
  getPromotionById,
  getPromotionTarget,
} from "./promotion.service.js";
import { BadRequestError, ConflictError } from "../errors/AppError.js";

export async function getVariantByFoodId(
  foodId,
  forAdmin = false,
  conn = pool,
) {
  try {
    const sql = `
        SELECT
            fv.id as variantId,
            fv.weight_gram,
            fv.originalPrice,
            fv.stock as inStock,
            fv.isActive,
            p.id as promotionId,
            p.type as typePromotion,
            p.value as valuePromotion
        FROM food_variants fv 
        LEFT JOIN promotion_targets pt ON pt.food_variantID = fv.id 
        LEFT JOIN promotions p ON p.id = pt.promotionID 
            AND NOW() BETWEEN p.start_at AND p.end_at 
            AND p.isActive = TRUE
        WHERE fv.foodID = ?  AND fv.isActive = true AND fv.stock > 0
        ORDER BY fv.weight_gram 
    `; // Nếu bỏ AND NOW() BETWEEN p.start_at AND p.end_at và AND p.isActive = TRUE xuống dưới where thì nó sẽ không khớp đk where nên nó sẽ bỏ các dòng mà promotion null
    const [rows] = await conn.execute(sql, [foodId]);
    const res = groupVariant(rows);
    if (forAdmin) return rows;
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

export async function updateVariant(
  { variantId, weight_gram, originalPrice, stock = 0, isActive = true },
  conn = pool,
) {
  validateVariant({ weight_gram, originalPrice, stock, isActive });
  const sql = `
    UPDATE food_variants
    SET weight_gram = ?, originalPrice = ?, stock = ?, isActive = ?
    WHERE id = ?
  `;
  const values = [weight_gram, originalPrice, stock, isActive, variantId];
  try {
    const [result] = await conn.execute(sql, values);
    return result.affectedRows === 1;
  } catch (error) {
    console.log(">>> SERVICE update variant ERROR:", error.message);
    if (error.code === "ER_DUP_ENTRY")
      throw new ConflictError("Weight gram already exists on food");
    throw error;
  }
}

export async function getVariantById(variantId, moreInf = false, conn = pool) {
  // moreInf là cờ để lấy thêm thông tin cho variant thông qua food
  let sql = "";
  if (moreInf) {
    sql = `
      SELECT
          fv.id as variantId,
          fv.weight_gram,
          fv.originalPrice,
          fv.stock as inStock,
          fv.foodID as foodId,
          f.foodName,
          f.image,

          p.type as typePromotion,
          p.value as valuePromotion
      FROM food_variants fv 
      JOIN foods f ON fv.foodID  = f.id
      LEFT JOIN promotion_targets pt ON pt.food_variantID = fv.id 
      LEFT JOIN promotions p ON p.id = pt.promotionID 
          AND NOW() BETWEEN p.start_at AND p.end_at 
          AND p.isActive = TRUE
      WHERE fv.id = ?
    `;
  } else {
    sql = `
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
      WHERE fv.id = ?
    `;
  }
  try {
    const [rows] = await conn.execute(sql, [variantId]);
    const res = groupVariant(rows);
    return res.length > 0 ? res[0] : null;
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
    let promotionType = null;
    let promotionValue = null;
    if (promotionId) {
      const promotion = await getPromotionById(promotionId, conn);
      if (!promotion) throw new BadRequestError("Promotion not found");

      promotionType = promotion.type;
      promotionValue = promotion.value;
      await createPromotionTarget({ promotionId, variantId }, conn);
    }

    await conn.commit();
    return {
      variantId,
      promotionType,
      promotionValue,
    };
  } catch (error) {
    await conn.rollback();
    console.log(">>> SERVICE createVariantWithPromotion ERROR:", error.message);
    throw error;
  } finally {
    conn.release();
  }
}

export async function updateVariantWithPromotion({
  variantId,
  weight_gram,
  originalPrice,
  stock,
  isActive,
  promotionId = null,
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // 1 cập nhật thông tin variant trước
    const updatedVariant = await updateVariant(
      {
        variantId,
        weight_gram,
        originalPrice,
        stock,
        isActive,
      },
      conn,
    );

    if (!updatedVariant) throw new BadRequestError("Food variant not found");

    if (promotionId) {
      const promotion = await getPromotionById(promotionId, conn);
      if (!promotion) throw new BadRequestError("Promotion not found");
    }

    const promotionTarget = await getPromotionTarget({ variantId }, conn);

    const currentPromotionId = promotionTarget
      ? promotionTarget.promotionId
      : null;

    if (currentPromotionId && !promotionId) {
      await deletePromotionTarget(
        {
          promotionId: currentPromotionId,
          variantId,
        },
        conn,
      );
    }
    if (!currentPromotionId && promotionId) {
      await createPromotionTarget({ promotionId, variantId }, conn);
    }
    if (
      currentPromotionId &&
      promotionId &&
      currentPromotionId !== promotionId
    ) {
      await deletePromotionTarget(
        {
          promotionId: currentPromotionId,
          variantId,
        },
        conn,
      );
      await createPromotionTarget({ promotionId, variantId }, conn);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    console.log("SERVICE updateVariantWithPromotion ERROR:", error.message);
    throw error;
  } finally {
    conn.release();
  }
}

export async function deleteVariant(variantId, conn = pool) {
  const sql = `DELETE FROM food_variants WHERE id = ?`;
  const values = [variantId];
  try {
    const [result] = await conn.execute(sql, values);
    return result.affectedRows === 1;
  } catch (error) {
    console.log(">>> SERVICE delete variant ERROR:", error.message);
    if (error.code === "ER_ROW_IS_REFERENCED_2")
      throw new ConflictError("RESOURCE_IN_USE");
    throw error;
  }
}

const updateStock = async (conn, variantId, quantityOrder) => {
  try {
    if (quantityOrder <= 0)
      throw new BadRequestError("The order quantity must be greater than zero");
    const [result] = await conn.execute(
      `
      UPDATE food_variants
      SET stock = stock - ?
      WHERE id = ? AND stock >= ?
      `,
      [quantityOrder, variantId, quantityOrder],
    );
    return result.affectedRows === 1;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR update stock:", error.message);
    throw error;
  }
};

export const deductStockForOrder = async (conn, cartItems) => {
  try {
    for (const item of cartItems) {
      const updated = await updateStock(conn, item.variantId, item.quantity);
      if (!updated) throw new ConflictError("Some products are out of stock.");
    }
    return true;
  } catch (error) {
    console.log(">>>>> SERVICE ERROR deduct stock:", error.message);
    throw error;
  }
};

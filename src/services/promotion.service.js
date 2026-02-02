import pool from "../config/db.js";
import { addStatusPromotion } from "../utils/promotion.util.js";
import { validatePromotion } from "./validators.js";

export async function getPromotions(conn = pool) {
  try {
    const sql = `
    SELECT
        id as promotionId,
        name,
        type,
        value,
        start_at,
        end_at,
        isActive
    FROM promotions p
    `;
    const [rows] = await conn.execute(sql); // [{promotionId, name, type, value, start_at, end_at, isActive}]
    const promotionsWithStatus = addStatusPromotion(rows);
    console.log(">>> promotions:", promotionsWithStatus);
    return rows;
  } catch (error) {
    console.log(">>> SERVICE get promotions ERROR:", error.message);
    throw error;
  }
}

export async function getPromotionById(promotionId, conn = pool) {
  try {
    const sql = `
    SELECT
        id as promotionId,
        name,
        type as typePromotion,
        value as valuePromotion,
        start_at,
        end_at,
        isActive
    FROM promotions p
    WHERE id = ?
    `;
    const [rows] = await conn.execute(sql, [promotionId]);
    return rows.length > 0 ? rows[0] : null; // {promotionId, name, type, value, start_at, end_at, isActive}
  } catch (error) {
    console.log(">>> SERVICE get promotion ERROR:", error.message);
    throw error;
  }
}

export async function createPromotion(
  { name, type, value, start_at, end_at, isActive = true },
  conn = pool,
) {
  try {
    validatePromotion({ name, type, value, start_at, end_at, isActive });
    const sql = `
        INSERT INTO promotions (name, type, value, start_at, end_at, isActive)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [name, type, value, start_at, end_at, isActive];
    const [result] = await conn.execute(sql, values);
    return result.insertId;
  } catch (error) {
    console.log(">>> SERVICE create promotion ERROR:", error.message);
    throw error;
  }
}

export async function updatePromotion(
  { promotionId, name, type, value, start_at, end_at, isActive = true },
  conn = pool,
) {
  try {
    validatePromotion({ name, type, value, start_at, end_at, isActive });
    const sql = `
        UPDATE promotions
        SET name = ?, type = ?, value = ?, start_at = ?, end_at = ?, isActive = ?
        WHERE id = ?
    `;
    const values = [name, type, value, start_at, end_at, isActive, promotionId];
    const [result] = await conn.execute(sql, values);
    return result.affectedRows === 1;
  } catch (error) {
    console.log(">>> SERVICE update promotion ERROR:", error.message);
    throw error;
  }
}

export async function deletePromotion(promotionId, conn = pool) {
  try {
    const sql = `
      DELETE FROM promotions WHERE id = ?
    `;
    const values = [promotionId];
    const [result] = await conn.execute(sql, values);
    return result.affectedRows === 1;
  } catch (error) {
    console.log(">>> SERVICE delete promotion ERROR:", error.message);
    throw error;
  }
}

export async function createPromotionTarget(
  { promotionId, variantId },
  conn = pool,
) {
  try {
    const sql = `
      INSERT INTO promotion_targets (food_variantID, promotionID )
      VALUES (?, ?)`;
    const values = [variantId, promotionId];
    const [result] = await conn.execute(sql, values);
    return result.insertId;
  } catch (error) {
    console.log(">>> SERVICE create promotion target ERROR:", error.message);
    throw error;
  }
}

export async function deletePromotionTarget(
  { promotionId, variantId },
  conn = pool,
) {
  try {
    const sql = `
      DELETE FROM promotion_targets
      WHERE promotionID = ? AND food_variantID = ?`;
    const values = [promotionId, variantId];
    const [result] = await conn.execute(sql, values);
    return result.affectedRows === 1;
  } catch (error) {
    console.log(">>> SERVICE delete promotion target ERROR:", error.message);
    throw error;
  }
}

export async function getPromotionTarget({ variantId }, conn = pool) {
  const sql = `
    SELECT 
      food_variantID as variantId,
      promotionID as promotionId
    FROM promotion_targets
    WHERE food_variantID = ?
  `;
  const values = [variantId];
  try {
    const [rows] = await conn.execute(sql, values);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log(">>> SERVICE getPromotionTarget ERROR:", error.message);
    throw error;
  }
}

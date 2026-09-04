import pool from "../config/db.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../errors/AppError.js";
import {
  addStatusPromotion,
  getStatusPromo,
  normalizeDatetime,
  validateUpdate,
} from "../utils/promotion.util.js";
import { validatePromotion } from "./validators.js";

export async function getPromotions(conn = pool) {
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
  return promotionsWithStatus;
}

export async function getPromotionById(promotionId, conn = pool) {
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
    WHERE id = ?
    `;
  const [rows] = await conn.execute(sql, [promotionId]);
  return rows.length > 0 ? rows[0] : null; // {promotionId, name, type, value, start_at, end_at, isActive}
}

export async function createPromotion(
  { name, type, value, start_at, end_at, isActive = true },
  conn = pool,
) {
  const normalizedData = {
    name,
    type,
    value,
    isActive,
    start_at: normalizeDatetime(start_at, "start"),
    end_at: normalizeDatetime(end_at, "end"),
  };

  validatePromotion(normalizedData);

    const sql = `
      INSERT INTO promotions (name, type, value, start_at, end_at, isActive)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      normalizedData.name,
      normalizedData.type,
      normalizedData.value,
      normalizedData.start_at,
      normalizedData.end_at,
      normalizedData.isActive,
    ];
  const [result] = await conn.execute(sql, values);
  const statusPromotion = getStatusPromo({
    start_at: normalizedData.start_at,
    end_at: normalizedData.end_at,
  });
  return { promotionId: result.insertId, status: statusPromotion };
}

export async function updatePromotion(
  { promotionId, name, type, value, start_at, end_at, isActive = true },
  conn = pool,
) {
  const normalizedData = {
    name,
    type,
    value,
    isActive,
    start_at: normalizeDatetime(start_at, "start"),
    end_at: normalizeDatetime(end_at, "end"),
  };

  validatePromotion(normalizedData);

    const promotion = await getPromotionById(promotionId, conn);
    if (!promotion) throw new NotFoundError("Promotion not found");
    const { start_at: start, end_at: end } = promotion;
    validateUpdate({ start_at: start, end_at: end });

    const sql = `
        UPDATE promotions
        SET name = ?, type = ?, value = ?, start_at = ?, end_at = ?, isActive = ?
        WHERE id = ?
    `;
    const values = [
      normalizedData.name,
      normalizedData.type,
      normalizedData.value,
      normalizedData.start_at,
      normalizedData.end_at,
      normalizedData.isActive,
      promotionId,
    ];
  const [result] = await conn.execute(sql, values);
  const statusPromotion = getStatusPromo({
    start_at: normalizedData.start_at,
    end_at: normalizedData.end_at,
  });
  return { newStatus: statusPromotion };
}

export async function updateActivePromotion(
  { promotionId, isActive },
  conn = pool,
) {
  const promotion = await getPromotionById(promotionId, conn);
  if (!promotion) throw new NotFoundError("Promotion not found");
  const { start_at, end_at } = promotion;
  validateUpdate({ start_at, end_at }, "ACTIVE");
  const sql = `
      UPDATE promotions
      SET isActive = ?
      WHERE id = ?
    `;
  const [result] = await conn.execute(sql, [isActive, promotionId]);
  return result.affectedRows === 1;
}

export async function deletePromotion(promotionId, conn = pool) {
  const sql = `
      DELETE FROM promotions WHERE id = ?
    `;
  const values = [promotionId];
  const [result] = await conn.execute(sql, values);
  return result.affectedRows === 1;
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
    if (error.code === "ER_DUP_ENTRY")
      throw new ConflictError("Food variant already exists promotion");
    throw error;
  }
}

export async function deletePromotionTarget(
  { promotionId, variantId },
  conn = pool,
) {
  const sql = `
      DELETE FROM promotion_targets
      WHERE promotionID = ? AND food_variantID = ?`;
  const values = [promotionId, variantId];
  const [result] = await conn.execute(sql, values);
  return result.affectedRows === 1;
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
  const [rows] = await conn.execute(sql, values);
  return rows.length > 0 ? rows[0] : null;
}

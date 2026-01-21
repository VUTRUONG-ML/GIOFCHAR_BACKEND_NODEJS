import pool from "../config/db.js";
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
    const [rows] = await conn.execute(sql);
    return rows; // [{promotionId, name, type, value, start_at, end_at, isActive}]
  } catch (error) {
    console.log(">>> SERVICE get promotions ERROR:", error.message);
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

import pool from "../config/db.js";
import logger from "../config/logger.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../errors/AppError.js";

const getAllCategories = async () => {
  try {
    // For pool initialization, see above
    const [categories] = await pool.execute(`
      SELECT 
        c.id AS categoryID,
        c.categoryName,
        c.categoryDescription,
        COUNT(f.id) as quantityFood
      FROM categories c 
      LEFT JOIN foods f ON c.id = f.categoryID
      GROUP BY c.id`);
    return categories;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const getNameCategory = async ({ categoryId = 0 }) => {
  const isWhere = categoryId ? "WHERE id = ?" : "";
  try {
    const [categories] = await pool.execute(
      `
      SELECT 
        c.categoryName
      FROM categories c
      ${isWhere}
      `,
      [categoryId],
    );
    return categories;
  } catch (err) {
    console.log(">>>>> Service error", err.message);
    throw err;
  }
};

const createCategory = async (name, description) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO categories (categoryName, categoryDescription)
        VALUES (?, ?)`,
      [name, description],
    );
    logger.info("CATEGORY_CREATED", { categoryId: result.insertId });
    return result;
  } catch (err) {
    console.log(">>>>> CATEGORY SERVICE ERROR", err.message);
    if (err.code === "ER_DUP_ENTRY")
      throw new ConflictError("Category name already exists");
    throw err;
  }
};

const getCategoryById = async (categoryId) => {
  try {
    const [categories] = await pool.execute(
      "SELECT * FROM categories WHERE id = ?",
      [categoryId],
    );
    return categories[0];
  } catch (err) {
    console.log(">>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const updateCategoryById = async (name, description, categoryId) => {
  try {
    const [result] = await pool.execute(
      `UPDATE categories 
        SET categoryName = ?, categoryDescription = ?
        WHERE id = ?`,
      [name, description, categoryId],
    );
    if (result.affectedRows === 0)
      throw new NotFoundError("Category not found.");
    return true;
  } catch (err) {
    console.log(">>>> SERVICE ERROR", err.message);
    if (err.code === "ER_DUP_ENTRY")
      throw new ConflictError("Category name already exists");
    throw err;
  }
};

const deleteCategoryById = async (categoryId) => {
  try {
    const [result] = await pool.execute("DELETE FROM categories WHERE id = ?", [
      categoryId,
    ]);
    if (result.affectedRows === 0)
      throw new NotFoundError("Category not found.");
    return true;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      // Còn tồn tại category trong food
      throw new BadRequestError("Cannot delete category.");
    }
    throw err;
  }
};
export default {
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
  getNameCategory,
};

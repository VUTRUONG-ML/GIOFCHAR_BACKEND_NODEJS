import pool from "../config/db.js";
import logger from "../config/logger.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../errors/AppError.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";

const getAllCategories = async () => {
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
};

const getNameCategory = async ({ categoryId = 0 }) => {
  const isWhere = categoryId ? "WHERE id = ?" : "";

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
};

const createCategory = async (name, description) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO categories (categoryName, categoryDescription)
        VALUES (?, ?)`,
      [name, description],
    );
    logger.debug(LOG_ACTIONS.CATEGORY.CREATE, {
      status: LOG_STATUSES.SUCCEEDED,
      categoryId: result.insertId,
    });
    return result;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      logger.warn(LOG_ACTIONS.CATEGORY.CREATE, {
        status: LOG_STATUSES.FAILED,
        reason: "DUPLICATE_CATEGORY",
      });
      throw new ConflictError("Category name already exists");
    }

    throw err;
  }
};

const getCategoryById = async (categoryId) => {
  const [categories] = await pool.execute(
    "SELECT * FROM categories WHERE id = ?",
    [categoryId],
  );
  if (!categories[0]) {
    throw new NotFoundError("Category not found.");
  }
  return categories[0];
};

const updateCategoryById = async (name, description, categoryId) => {
  try {
    const [result] = await pool.execute(
      `UPDATE categories 
        SET categoryName = ?, categoryDescription = ?
        WHERE id = ?`,
      [name, description, categoryId],
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError("Category not found.");
    }
    logger.debug(LOG_ACTIONS.CATEGORY.UPDATE, {
      status: LOG_STATUSES.SUCCEEDED,
      categoryId,
    });
    return true;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      logger.warn(LOG_ACTIONS.CATEGORY.UPDATE, {
        status: LOG_STATUSES.FAILED,
        reason: "DUPLICATE_CATEGORY",
        categoryId,
      });
      throw new ConflictError("Category name already exists");
    }
    throw err;
  }
};

const deleteCategoryById = async (categoryId) => {
  try {
    const [result] = await pool.execute("DELETE FROM categories WHERE id = ?", [
      categoryId,
    ]);
    if (result.affectedRows === 0) {
      throw new NotFoundError("Category not found.");
    }
    logger.debug(LOG_ACTIONS.CATEGORY.DELETE, {
      status: LOG_STATUSES.SUCCEEDED,
      categoryId,
    });
    return true;
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      logger.warn(LOG_ACTIONS.CATEGORY.DELETE, {
        status: LOG_STATUSES.FAILED,
        reason: "CATEGORY_REFERENCED",
        categoryId,
      });
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

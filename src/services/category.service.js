const pool = require("../config/db");

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

const createCategory = async (name, description) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO categories (categoryName, categoryDescription)
        VALUES (?, ?)`,
      [name, description]
    );
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const getCategoryById = async (categoryId) => {
  try {
    const [categories] = await pool.execute(
      "SELECT * FROM categories WHERE id = ?",
      [categoryId]
    );
    return categories;
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
      [name, description, categoryId]
    );
    return result;
  } catch (err) {
    console.log(">>>> SERVICE ERROR", err.message);
    throw err;
  }
};

const deleteCategoryById = async (categoryId) => {
  try {
    const result = await pool.execute("DELETE FROM categories WHERE id = ?", [
      categoryId,
    ]);
    return result;
  } catch (err) {
    console.log(">>>>> SERVICE ERROR", err.message);
    throw err;
  }
};
module.exports = {
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
};

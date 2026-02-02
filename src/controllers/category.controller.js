import categoryService from "../services/category.service.js";

const getAllCategories = async (req, res) => {
  const { role } = req.user;
  try {
    const categories = await categoryService.getAllCategories();
    if (!categories.length)
      return res.status(404).json({ message: "Empty categories list" });
    if (role === "admin") {
      return res.status(200).json({ quantity: categories.length, categories });
    }
    const categoriesClient = categories.map(
      ({ categoryDescription, quantityFood, ...categoryClient }) =>
        categoryClient,
    );
    return res.status(200).json({
      quantity: categoriesClient.length,
      categories: categoriesClient,
    });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createCategory = async (req, res) => {
  const { categoryName, categoryDescription } = req.body;

  if (!categoryName || !categoryDescription)
    return res.status(400).json({ message: "Missing field" });
  try {
    const result = await categoryService.createCategory(
      categoryName,
      categoryDescription,
    );

    res.status(201).json({
      message: "Create category successful",
      categoryId: result.insertId,
    });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);

    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Category name already exists" });

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getCategoryById = async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const category = await categoryService.getCategoryById(categoryId);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json(category);
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateCategoryById = async (req, res) => {
  const { categoryName, categoryDescription } = req.body;
  const categoryId = req.params.categoryId;

  if (!categoryName || !categoryDescription) {
    const field = !categoryName ? "name" : "desc";
    return res.status(400).json({ message: "Missing field " + field });
  }

  try {
    const result = await categoryService.updateCategoryById(
      categoryName,
      categoryDescription,
      categoryId,
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json({
      message: "Update category successful",
    });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);

    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Category name already exists" });

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteCategoryById = async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const result = await categoryService.deleteCategoryById(categoryId);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ message: "Delete category successful" });
  } catch (err) {
    console.log(">>>>> CONTROLLER ERROR", err.message);
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "Cannot delete category",
      });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export default {
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
};

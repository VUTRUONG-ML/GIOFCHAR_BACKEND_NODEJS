import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import { asyncHandler } from "../errors/errorHandler.js";
import categoryService from "../services/category.service.js";

const getAllCategories = asyncHandler(async (req, res) => {
  const { role } = req.user;

  const categories = await categoryService.getAllCategories();
  if (!categories.length) throw new NotFoundError("Empty categories list");
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
});

const createCategory = asyncHandler(async (req, res) => {
  const { categoryName, categoryDescription } = req.body;

  if (!categoryName || !categoryDescription)
    throw new BadRequestError("Missing field");

  const result = await categoryService.createCategory(
    categoryName,
    categoryDescription,
  );

  return res.status(201).json({
    message: "Create category successful",
    categoryId: result.insertId,
  });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const categoryId = req.params.categoryId;

  const category = await categoryService.getCategoryById(categoryId);
  if (!category) throw new NotFoundError("Category not found");
  return res.status(200).json(category);
});

const updateCategoryById = asyncHandler(async (req, res) => {
  const { categoryName, categoryDescription } = req.body;
  const categoryId = req.params.categoryId;

  if (!categoryName || !categoryDescription) {
    const field = !categoryName ? "name" : "desc";
    throw new BadRequestError("Missing field " + field);
  }

  await categoryService.updateCategoryById(
    categoryName,
    categoryDescription,
    categoryId,
  );

  res.status(200).json({
    message: "Update category successful",
  });
});

const deleteCategoryById = asyncHandler(async (req, res) => {
  const categoryId = req.params.categoryId;

  await categoryService.deleteCategoryById(categoryId);

  return res.status(200).json({ message: "Delete category successful" });
});
export default {
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
};

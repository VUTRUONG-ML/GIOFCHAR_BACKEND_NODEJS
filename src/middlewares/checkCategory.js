import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import { asyncHandler } from "../errors/errorHandler.js";
import categoryService from "../services/category.service.js";
export const checkCategoryExists = asyncHandler(async (req, res, next) => {
  const categoryID = req.body.categoryID || req.params.categoryID;

  if (!categoryID) throw new BadRequestError("Missing categoryID");

  const category = await categoryService.getCategoryById(categoryID);

  if (!category) throw new NotFoundError("Category not found.");
  next(); // Cho phép đi tiếp nếu category tồn tại
});

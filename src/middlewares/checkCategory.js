const categoryService = require("../services/category.service");
const checkCategoryExists = async (req, res, next) => {
  const categoryID = req.body.categoryID || req.params.categoryID;

  if (!categoryID) {
    return res.status(400).json({ message: "Missing categoryID" });
  }

  try {
    const categories = await categoryService.getCategoryById(categoryID);

    if (!categories.length)
      return res.status(404).json({ message: "Category not found" });
    next(); // Cho phép đi tiếp nếu category tồn tại
  } catch (err) {
    console.error(">>>>> MIDDLEWARE ERROR:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

module.exports = checkCategoryExists;

const { uploadImage, deleteImage } = require("../services/cloudinary.service");
const fs = require("fs");
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) {
    console.log("No image upload");
    return next();
  }
  try {
    const result = await uploadImage(req.file.path, {
      folder: "GIOFCHAR_BACKEND_NODEJS_SQL",
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
    req.cloudinaryImage = result;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
  }
  next();
};

const deleteFromCloudinary = async (req, res, next) => {
  const publicId = req.food.imagePublicId;
  try {
    const result = await deleteImage(publicId);
  } catch (err) {
    console.error(err);
  }
  next();
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };

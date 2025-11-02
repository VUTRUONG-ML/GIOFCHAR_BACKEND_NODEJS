const { uploadImage } = require("../services/cloudinary.service");
const fs = require("fs");
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return res.status(404).json({ message: "No image upload" });
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
    next();
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    res.status(500).json({ message: "Server failed to upload image" });
  }
};

module.exports = uploadToCloudinary;

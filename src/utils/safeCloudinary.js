const { deleteImage } = require("../services/cloudinary.service");

const safeDeleteCloudinary = async (publicId) => {
  try {
    const result = await deleteImage(publicId);
  } catch (err) {
    console.error("Failed to delete cloudinary image:", err.message);
  }
};

module.exports = safeDeleteCloudinary;

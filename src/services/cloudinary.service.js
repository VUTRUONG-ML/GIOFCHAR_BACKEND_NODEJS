const cloudinary = require("../config/cloudinary");
// Use the uploaded file's name as the asset's public ID and
// allow overwriting the asset with new versions
// const options = {
//   folder: "GIOFCHAR_BACKEND_NODEJS_SQL",
//   use_filename: true,
//   unique_filename: false,
//   overwrite: true,
// };
const uploadImage = async (imagePath, options) => {
  try {
    // Upload the image
    const result = await cloudinary.uploader.upload(imagePath, options);
    return result;
  } catch (error) {
    throw error;
  }
};

const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    return result;
  } catch (err) {
    console.error("Failed to delete image from Cloudinary:", err.message);
    throw err;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};

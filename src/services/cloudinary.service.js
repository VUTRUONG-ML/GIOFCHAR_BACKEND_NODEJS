import cloudinary from "../config/cloudinary.js";
// Use the uploaded file's name as the asset's public ID and
// allow overwriting the asset with new versions
// const options = {
//   folder: "GIOFCHAR_BACKEND_NODEJS_SQL",
//   use_filename: true,
//   unique_filename: false,
//   overwrite: true,
// };
export const uploadImage = async (imagePath, options) => {
  // Upload the image
  const result = await cloudinary.uploader.upload(imagePath, options);
  return result;
};

export const deleteImage = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
  return result;
};

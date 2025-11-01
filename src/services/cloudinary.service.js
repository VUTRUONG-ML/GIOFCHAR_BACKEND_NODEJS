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
    console.log(result);
    return result.public_id;
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  uploadImage,
};

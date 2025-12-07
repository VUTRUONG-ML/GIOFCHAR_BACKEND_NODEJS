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
    req.cloudinaryImage = result; // secure_url,public_id
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
  } finally {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }
  next();
};

const deleteFromCloudinary = async (req, res, next) => {
  const publicId = req.food.imagePublicId;
  console.log("check imageId", publicId);
  if (!publicId) return next();
  try {
    const result = await deleteImage(publicId);
  } catch (err) {
    console.error(err);
  }
  next();
};

// middleware xóa ảnh trên cloudinary khi mà sau khi upload cloudinary rồi thì gặp lỗi ở controller ko tạo food được
const cleanupCloudinary = async (req, res, next) => {
  const oldJson = res.json;
  console.log("Đã vào cleanup");
  res.json = async function (data) {
    const publicIdImg = req.cloudinaryImage?.public_id;
    if (res.statusCode >= 400 && publicIdImg) {
      console.log("Tồn tại");
      try {
        await deleteImage(publicIdImg);
        console.log(">>>> Đã cleanup thành công");
      } catch (error) {
        console.error("Rollback failed:", error.message);
      }
    }

    return oldJson.apply(res, arguments);
  };

  next();
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  cleanupCloudinary,
};

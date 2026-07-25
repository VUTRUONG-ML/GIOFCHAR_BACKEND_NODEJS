import { FOOD_IMAGE_OPTIONS } from "../constants/cloudinaryOptions.js";
import { uploadImage, deleteImage } from "../services/cloudinary.service.js";
import fs from "fs";
import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";
export const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) {
    logger.debug(LOG_ACTIONS.CLOUDINARY.UPLOAD_IMAGE, {
      status: LOG_STATUSES.SKIPPED,
      reason: "FILE_NOT_PROVIDED",
    });
    return next();
  }
  try {
    const result = await uploadImage(req.file.path, FOOD_IMAGE_OPTIONS);
    req.cloudinaryImage = result; // secure_url,public_id
  } catch (err) {
    logger.error(LOG_ACTIONS.CLOUDINARY.UPLOAD_IMAGE, {
      status: LOG_STATUSES.FAILED,
      reason: err.code || "CLOUDINARY_UPLOAD_FAILED",
    });
  } finally {
    fs.unlink(req.file.path, (err) => {
      if (err) {
        logger.warn(LOG_ACTIONS.FILE.DELETE_TEMPORARY, {
          status: LOG_STATUSES.FAILED,
          reason: err.code || "TEMP_FILE_DELETE_FAILED",
        });
      }
    });
  }
  next();
};

export const deleteFromCloudinary = async (req, res, next) => {
  const publicId = req.food.imagePublicId;
  if (!publicId) return next();
  try {
    await deleteImage(publicId);
  } catch (err) {
    logger.error(LOG_ACTIONS.CLOUDINARY.DELETE_IMAGE, {
      status: LOG_STATUSES.FAILED,
      reason: err.code || "CLOUDINARY_DELETE_FAILED",
    });
  }
  next();
};

// middleware xóa ảnh trên cloudinary khi mà sau khi upload cloudinary rồi thì gặp lỗi ở controller ko tạo food được
export const cleanupCloudinary = async (req, res, next) => {
  const oldJson = res.json;
  res.json = async function (data) {
    const publicIdImg = req.cloudinaryImage?.public_id;
    if (res.statusCode >= 400 && publicIdImg) {
      try {
        await deleteImage(publicIdImg);
        logger.info(LOG_ACTIONS.CLOUDINARY.CLEANUP_IMAGE, {
          status: LOG_STATUSES.SUCCEEDED,
        });
      } catch (error) {
        logger.error(LOG_ACTIONS.CLOUDINARY.CLEANUP_IMAGE, {
          status: LOG_STATUSES.FAILED,
          reason: error.code || "CLOUDINARY_CLEANUP_FAILED",
        });
      }
    }

    return oldJson.apply(res, arguments);
  };

  next();
};

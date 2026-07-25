import { deleteImage } from "../services/cloudinary.service.js";
import logger from "../config/logger.js";
import {
  LOG_ACTIONS,
  LOG_STATUSES,
} from "../constants/logEvents.js";

export const safeDeleteCloudinary = async (publicId) => {
  try {
    await deleteImage(publicId);
  } catch (err) {
    logger.error(LOG_ACTIONS.CLOUDINARY.DELETE_IMAGE, {
      status: LOG_STATUSES.FAILED,
      reason: err.code || "CLOUDINARY_DELETE_FAILED",
    });
  }
};

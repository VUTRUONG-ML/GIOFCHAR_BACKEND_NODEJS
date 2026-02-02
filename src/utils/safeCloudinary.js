import { deleteImage } from "../services/cloudinary.service.js";

export const safeDeleteCloudinary = async (publicId) => {
  try {
    const result = await deleteImage(publicId);
  } catch (err) {
    console.error("Failed to delete cloudinary image:", err.message);
  }
};

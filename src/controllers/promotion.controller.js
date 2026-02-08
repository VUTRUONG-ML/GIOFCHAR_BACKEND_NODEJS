import {
  createPromotion,
  deletePromotion,
  getPromotions,
  updateActivePromotion,
  updatePromotion,
} from "../services/promotion.service.js";

import { BadRequestError, NotFoundError } from "../errors/AppError.js";

export const createPromotionController = async (req, res) => {
  const { name, type, value, start_at, end_at, isActive } = req.body;
  if (!name || !type || value == null || !start_at || !end_at) {
    throw new BadRequestError("Missing required fields");
  }
  const newActive =
    isActive === "true" ||
    isActive === true ||
    isActive === 1 ||
    isActive === "1"
      ? true
      : false;
  const newPromotion = await createPromotion({
    name,
    type,
    value,
    start_at,
    end_at,
    isActive: newActive,
  });

  return res.status(201).json({
    message: "Create promotion successful",
    promotionId: newPromotion.promotionId,
    status: newPromotion.status,
  });
};

export const getPromotionsController = async (req, res) => {
  const promotions = await getPromotions();
  return res.status(200).json(promotions);
};

export const updatePromotionController = async (req, res) => {
  const { name, type, value, start_at, end_at, isActive } = req.body;
  const { promotionId } = req.params;
  if (!name || !type || value == null || !start_at || !end_at) {
    throw new BadRequestError("Missing required fields");
  }
  const newActive =
    isActive === "true" ||
    isActive === true ||
    isActive === 1 ||
    isActive === "1"
      ? true
      : false;
  const updated = await updatePromotion({
    promotionId,
    name,
    type,
    value,
    start_at,
    end_at,
    isActive: newActive,
  });
  return res.status(201).json({
    message: "Update promotion successful",
    newStatus: updated.newStatus,
  });
};
export const updatedActiveController = async (req, res) => {
  const { isActive } = req.body;
  const { promotionId } = req.params;
  if (typeof isActive !== "boolean") {
    throw new BadRequestError("Invalid is active promotion");
  }
  const newActive =
    isActive === "true" ||
    isActive === true ||
    isActive === 1 ||
    isActive === "1"
      ? true
      : false;
  await updateActivePromotion({ promotionId, isActive: newActive });
  return res
    .status(200)
    .json({ message: "Update active promotion successful" });
};

export const deletePromotionController = async (req, res) => {
  const { promotionId } = req.params;

  const deleted = await deletePromotion(promotionId);
  if (!deleted) throw new NotFoundError("Promotion not found");

  return res.status(200).json({
    message: "Delete promotion successful",
  });
};

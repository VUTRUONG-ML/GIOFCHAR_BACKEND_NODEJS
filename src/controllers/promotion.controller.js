import {
  createPromotion,
  getPromotions,
} from "../services/promotion.service.js";
import { asyncHandler } from "../errors/errorHandler.js";
import { BadRequestError } from "../errors/AppError.js";

export const createPromotionController = asyncHandler(async (req, res) => {
  const { name, type, value, start_at, end_at, isActive } = req.body;
  if (!name || !type || value == null || !start_at || !end_at) {
    throw new BadRequestError("Missing required fields");
  }
  const newPromotionId = await createPromotion({
    name,
    type,
    value,
    start_at,
    end_at,
    isActive,
  });

  return res.status(201).json({
    message: "Create promotion successful",
    promotionId: newPromotionId,
  });
});

export const getPromotionsController = async (req, res) => {
  const promotions = await getPromotions();
  return res.status(200).json(promotions);
};

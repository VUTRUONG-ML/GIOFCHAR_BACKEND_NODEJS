import {
  createPromotion,
  getPromotions,
  updatePromotion,
} from "../services/promotion.service.js";
import { asyncHandler } from "../errors/errorHandler.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";

export const createPromotionController = asyncHandler(async (req, res) => {
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
  const newPromotionId = await createPromotion({
    name,
    type,
    value,
    start_at,
    end_at,
    isActive: newActive,
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

  if (!updated) throw new NotFoundError("Promotion not found");

  return res.status(201).json({
    message: "Update promotion successful",
  });
};

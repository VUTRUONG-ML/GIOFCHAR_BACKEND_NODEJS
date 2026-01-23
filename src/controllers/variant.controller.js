import { BadRequestError } from "../errors/AppError.js";
import { createVariantWithPromotion } from "../services/variant.service.js";

export async function createVariantController(req, res) {
  const { weight_gram, originalPrice, stock, promotionId } = req.body;
  const { foodId } = req.params;
  if (!weight_gram || !originalPrice || !stock)
    throw new BadRequestError("Missing field");

  const variantId = await createVariantWithPromotion({
    foodId,
    weight_gram,
    originalPrice,
    stock,
    promotionId,
  });

  return res
    .status(201)
    .json({ message: "Create food variant success ful", variantId });
}

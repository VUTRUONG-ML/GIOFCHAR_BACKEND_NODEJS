import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import {
  createVariantWithPromotion,
  deleteVariant,
  updateVariantWithPromotion,
} from "../services/variant.service.js";

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

export async function updateVariantController(req, res) {
  const { weight_gram, originalPrice, stock, isActive, promotionId } = req.body;
  const { foodId, variantId } = req.params;
  if (!weight_gram || !originalPrice || !stock)
    throw new BadRequestError("Missing field");

  const finalActive =
    isActive === "1" ||
    isActive === 1 ||
    isActive === "true" ||
    isActive === true
      ? true
      : false;

  await updateVariantWithPromotion({
    variantId,
    weight_gram,
    originalPrice,
    stock,
    isActive: finalActive,
    promotionId,
  });
  return res.status(200).json({ message: "Update food variant successful" });
}

export async function deleteVariantController(req, res) {
  const { variantId } = req.params;
  const deleted = await deleteVariant(variantId);
  if (!deleted) throw new NotFoundError("Variant not found");

  return res.status(200).json({ message: "Delete food variant successful" });
}

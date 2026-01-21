import { BadRequestError } from "../errors/AppError.js";
export function validateOwner({ userId, guestToken }) {
  if (userId && guestToken) {
    throw new Error("Asset cannot belong to both user and guest");
  }

  if (!userId && !guestToken) {
    throw new Error("Asset must have an owner");
  }
}

export function validatePromotion({
  name,
  type,
  value,
  start_at,
  end_at,
  isActive,
}) {
  if (!name || typeof name !== "string") {
    throw new BadRequestError("Invalid promotion name");
  }

  if (!["PERCENT", "FIXED"].includes(type)) {
    throw new BadRequestError("Invalid promotion type");
  }

  if (typeof value !== "number" || value <= 0) {
    throw new BadRequestError("Invalid promotion value");
  }

  if (type === "PERCENT" && value > 100) {
    throw new BadRequestError("Percent promotion cannot exceed 100%");
  }

  const start = new Date(start_at);
  const end = new Date(end_at);

  if (isNaN(start) || isNaN(end)) {
    throw new BadRequestError("Invalid date format");
  }

  if (start >= end) {
    throw new BadRequestError("start_at must be before end_at");
  }

  if (typeof isActive !== "boolean") {
    throw new BadRequestError("Invalid is active promotion");
  }
}

import { BadRequestError } from "../errors/AppError.js";

export function addStatusPromotion(rows) {
  // [{promotionId, name, type, value, start_at, end_at, isActive}]
  const newRows = rows.map((r) => {
    const { promotionId, name, type, value, start_at, end_at, isActive } = r;
    const status = getStatusPromo({ start_at, end_at });
    const newRow = {
      promotionId,
      name,
      type,
      value,
      start_at,
      end_at,
      status,
      isActive,
    };
    return newRow;
  });
  return newRows;
}
export function getStatusPromo({ start_at, end_at }) {
  const now = new Date();
  const start = new Date(start_at);
  const end = new Date(end_at);
  if (now < start) return "UPCOMING";
  if (now > end) return "EXPIRED";
  return "ACTIVE";
}

export function validateUpdate({ start_at, end_at }, typeUpdate = "") {
  if (
    typeUpdate === "ACTIVE" &&
    getStatusPromo({ start_at, end_at }) !== "ACTIVE"
  )
    throw new BadRequestError("Invalid status promotion");
  // update toàn bộ thì trạng thái phải là upcoming
  if (
    typeUpdate !== "ACTIVE" &&
    getStatusPromo({ start_at, end_at }) !== "UPCOMING"
  ) {
    throw new BadRequestError("Invalid status promotion");
  }
}

export function normalizeDatetime(input, type) {
  if (!input) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return type === "start" ? `${input} 00:00:00` : `${input} 23:59:59`;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)) {
    return input;
  }

  throw new BadRequestError("Invalid datetime format");
}

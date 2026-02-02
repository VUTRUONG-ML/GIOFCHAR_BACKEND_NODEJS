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
      ...(status === "ACTIVE" && {
        isActive,
      }),
    };
    return newRow;
  });
  return newRows;
}

function getStatusPromo({ start_at, end_at }) {
  const now = new Date();
  const start = new Date(start_at);
  const end = new Date(end_at);
  if (now < start) return "UPCOMING";
  if (now > end) return "EXPIRED";
  return "ACTIVE";
}

export function validateUpdate({ start_at, end_at }, typeUpdate = "") {
  console.log(">>> statuts", typeUpdate, getStatusPromo({ start_at, end_at }));
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

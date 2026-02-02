export function addStatusPromotion(rows) {
  // [{promotionId, name, type, value, start_at, end_at, isActive}]
  const newRows = rows.map((r) => {
    const { promotionId, name, type, value, start_at, end_at, isActive } = r;
    let status;
    const now = new Date();
    const start = new Date(start_at);
    const end = new Date(end_at);
    if (now < start) status = "UPCOMING";
    else if (now > end) status = "EXPIRED";
    else status = "ACTIVE";
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

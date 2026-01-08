export const getTopProducts = (rows, rank) => {
  // rows: [{foodName, countSold}] - countSold DESC
  // rank: là số lượng sản phẩm muốn lấy từ rows
  if (rows.length === 0) return [];
  if (rank > rows.length) {
    rank = rows.length;
  }
  const totalCount = rows.reduce((acc, cur) => {
    acc += Number(cur.countSold) ?? 0;
    return acc;
  }, 0);
  const result = [];
  for (let i = 0; i < rank; i++) {
    const p = rows[i];
    const percentProduct = Math.floor(
      ((Number(p.countSold) ?? 0) / totalCount) * 100
    );
    console.log(totalCount, Number(p.countSold) ?? 0);
    result.push({ foodName: p.foodName, percent: percentProduct });
  }

  return result;
};

export const classificationStockLevel = (rows) => {
  // rows: [{foodName, stock}]
  const levelSeparation = 10;
  return rows.map((r) => ({
    ...r,
    status: r.stock >= levelSeparation ? "low" : "very_low",
  }));
};

export const getTopProducts = (rows, rank) => {
  // rows: [{foodName, countSold}] - countSold DESC
  // rank: là số lượng sản phẩm muốn lấy từ rows
  if (rows.length === 0) return [];
  if (rank > rows.length) {
    rank = rows.length;
  }
  const totalSold = rows.reduce((acc, cur) => {
    acc += Number(cur.countSold) ?? 0;
    return acc;
  }, 0);
  const result = [];
  let totalPercentTopProduct = 0;
  let totalSoldTopProduct = 0;
  for (let i = 0; i < rank; i++) {
    const p = rows[i];
    const percentProduct = Math.ceil(
      ((Number(p.countSold) ?? 0) / totalSold) * 100
    );

    totalPercentTopProduct += percentProduct;
    totalSoldTopProduct += Number(p.countSold);
    result.push({
      foodName: p.foodName,
      percent: percentProduct,
      countSold: Number(p.countSold),
    });
  }
  result.push({
    foodName: "remaining",
    percent: 100 - totalPercentTopProduct,
    countSold: totalSold - totalSoldTopProduct,
  });

  return result;
};

export const classificationStockLevel = (rows) => {
  // rows: [{foodName, stock}]
  const levelSeparation = 10;
  return rows.map((r) => ({
    ...r,
    status: r.stock >= levelSeparation ? "low" : "critical",
  }));
};

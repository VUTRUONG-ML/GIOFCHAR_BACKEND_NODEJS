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
      ((Number(p.countSold) ?? 0) / totalSold) * 100,
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

function calcVariantDiscount(rows) {
  // rows: [{foodId, foodName, image, categoryID, categoryName, variantId, weight_gram, originalPrice, promotionId, promotionType, promotionValue, start_at, end_at, isActive}]

  const map = {};

  for (const r of rows) {
    const key = r.variantId;
    if (!map[key]) {
      map[key] = {
        foodId: r.foodId,
        maxDiscount: 0,
        originalPrice: Number(r.originalPrice),
      };
    }

    let discount = 0;
    if (r.promotionType === "FIXED") {
      discount = Number(r.promotionValue);
    } else if (r.promotionType === "PERCENT") {
      discount = (Number(r.promotionValue) / 100) * map[key].originalPrice;
    }
    map[key].maxDiscount = Math.max(map[key].maxDiscount, discount);
  }

  return Object.values(map).map((v) => ({
    ...v,
    finalPrice: v.originalPrice - v.maxDiscount,
  }));
}

export const buildPreview = (rows) => {
  // rows: [{foodId, foodName, image, rating, categoryID, categoryName, variantId, weight_gram, originalPrice, promotionId, promotionType, promotionValue, start_at, end_at, isActive}]
  if (!rows.length) return [];
  const { foodId, foodName, image, categoryID, categoryName, rating } = rows[0];
  const variants = calcVariantDiscount(rows);
  const foodMap = {};
  for (const v of variants) {
    if (!foodMap[v.foodId]) {
      foodMap[v.foodId] = {
        foodId,
        foodName,
        image,
        rating,
        categoryID,
        categoryName,
        discount: 0,
        price: v.originalPrice,
      };
    }

    foodMap[v.foodId].discount = Math.max(
      foodMap[v.foodId].discount,
      v.maxDiscount,
    );
    foodMap[v.foodId].price = Math.min(foodMap[v.foodId].price, v.finalPrice);
  }
  return Object.values(foodMap);
};

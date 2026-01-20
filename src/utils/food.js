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
  // rows: [{foodId, foodName, image, rating, categoryID, categoryName, variantId, weight_gram, originalPrice, promotionId, promotionType, promotionValue, start_at, end_at, isActive}]
  const map = {};

  for (const r of rows) {
    const key = r.variantId;
    if (!map[key]) {
      map[key] = {
        foodId: r.foodId,
        foodName: r.foodName,
        image: r.image,
        rating: r.rating,
        categoryID: r.categoryID,
        categoryName: r.categoryName,

        maxDiscount: 0,
        originalPrice: Number(r.originalPrice),
      };
    }

    let discount = 0;
    if (r.promotionType && r.promotionValue) {
      if (r.promotionType === "FIXED") {
        discount = Number(r.promotionValue);
      } else if (r.promotionType === "PERCENT") {
        discount = (Number(r.promotionValue) / 100) * map[key].originalPrice;
      }
    }
    map[key].maxDiscount = Math.max(map[key].maxDiscount, discount);
  }

  return Object.values(map).map((v) => ({
    ...v,
    finalPrice:
      v.originalPrice - v.maxDiscount > 0 ? v.originalPrice - v.maxDiscount : 0,
  }));
}

export const buildPreview = (rows) => {
  // rows: [{foodId, foodName, image, rating, categoryID, categoryName, variantId, weight_gram, originalPrice, promotionId, promotionType, promotionValue, start_at, end_at, isActive}]
  if (!rows.length) return [];
  const variants = calcVariantDiscount(rows); // group theo variant truoc
  const foodMap = {};
  for (const v of variants) {
    const { foodId, foodName, image, rating, categoryID, categoryName } = v;
    if (!foodMap[v.foodId]) {
      foodMap[v.foodId] = {
        foodId,
        foodName,
        image,
        rating,
        categoryID,
        categoryName,
        discount: 0,
        price: Infinity,
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

export async function attachVariantToFood(food, variants) {
  const mapVariant = new Map(
    variants.map((variant) => [variant.foodId, { ...variant }]),
  );
  let newFood = foods.reduce((acc, food) => {
    const foodId = food.foodId;
    if (!acc[foodId]) {
      acc[foodId] = {
        ...food,
        variants: [],
      };
    }
    Object.values(mapVariant[foodId]).forEach((variant) =>
      acc[foodId].variants.push({
        variantId,
        weight_gram,
        originalPrice,
        price,
        inStock,
        discountPercent,
        discountFixed,
      }),
    );
  }, {});
  newFood = { ...food, variants: variants };

  return Object.values(newFoods);
}

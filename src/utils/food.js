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
  const map = new Map();

  for (const r of rows) {
    const key = r.variantId;
    const {
      foodId,
      foodName,
      image,
      rating,
      categoryID,
      categoryName,
      ...otherInf
    } = r;
    if (!map.has(key)) {
      map.set(key, {
        foodId: r.foodId,
        foodName: r.foodName,
        image: r.image,
        rating: r.rating,
        categoryID: r.categoryID,
        categoryName: r.categoryName,
        originalPrice: Number(r.originalPrice),
        maxDiscount: 0,
        maxDiscountPercent: 0,
      });
    }

    const item = map.get(key);
    let discount = 0; // này để tính khoản giá
    let discountPercent = 0; // này để hiển thị thêm tag giảm bao nhiêu phần trăm
    if (r.promotionType && r.promotionValue) {
      if (r.promotionType === "FIXED") {
        discount = Math.min(Number(r.promotionValue), item.originalPrice);
        discountPercent = Math.floor(
          (Math.min(Number(r.promotionValue), item.originalPrice) /
            item.originalPrice) *
            100,
        );
      } else if (r.promotionType === "PERCENT") {
        discount = (Number(r.promotionValue) / 100) * item.originalPrice;
        discountPercent = Math.min(Number(r.promotionValue), 100);
      }
    }

    item.maxDiscount = Math.max(item.maxDiscount, discount);
    item.maxDiscountPercent = Math.max(
      item.maxDiscountPercent,
      discountPercent,
    );
  }
  const foods = [...map.values()].map((v) => ({
    ...v,
    finalPrice:
      v.originalPrice - v.maxDiscount > 0 ? v.originalPrice - v.maxDiscount : 0,
  }));
  return foods;
}
// rows: [{foodId, foodName, image, rating, categoryID, categoryName, variantId, weight_gram, originalPrice, promotionId, promotionType, promotionValue}]
export const buildPreview = (rows) => {
  if (!rows.length) return [];

  const variants = calcVariantDiscount(rows); // group theo variant trước
  const foodMap = new Map();

  for (const v of variants) {
    const { foodId, foodName, image, rating, categoryID, categoryName } = v;

    if (!foodMap.has(foodId)) {
      foodMap.set(foodId, {
        foodId,
        foodName,
        image,
        rating,
        categoryID,
        categoryName,
        discount: 0,
        minPrice: Infinity,
        maxPrice: 0,
      });
    }

    const food = foodMap.get(foodId);

    food.discount = Math.max(food.discount, v.maxDiscountPercent);
    food.minPrice = Math.min(food.minPrice, v.finalPrice);
    food.maxPrice = Math.max(food.maxPrice, v.finalPrice);
  }

  return Array.from(foodMap.values());
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

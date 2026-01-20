export function groupVariant(rows) {
  // rows: [{variantId, weight_gram, originalPrice, inStock, typePromotion, valuePromotion}]
  const map = {};
  for (const r of rows) {
    const key = r.variantId;
    const {
      weight_gram,
      originalPrice,
      inStock,
      typePromotion,
      valuePromotion,
    } = r;
    if (!map[key]) {
      map[key] = {
        variantId: key,
        weight_gram,
        originalPrice,
        price: originalPrice,
        inStock,
        discountPercent: 0,
        discountFixed: 0,
      };
    }

    let discountPercent = 0;
    let discountFixed = 0;
    if (typePromotion && valuePromotion) {
      if (
        typePromotion === "FIXED" &&
        valuePromotion < map[key].originalPrice
      ) {
        discountFixed = valuePromotion;
        discountPercent = Math.round(
          (valuePromotion / map[key].originalPrice) * 100,
        );
      }
      if (typePromotion === "PERCENT" && valuePromotion < 100) {
        discountPercent = valuePromotion;
        discountFixed = (valuePromotion / 100) * map[key].originalPrice;
      }
    }
    if (discountFixed > map[key].discountFixed) {
      map[key].discountFixed = discountFixed;
      map[key].discountPercent = discountPercent;
      map[key].price = originalPrice - discountFixed;
    }
  }
  return Object.values(map);
}

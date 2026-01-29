export function groupVariant(rows, forOrder = false) {
  // rows: [{variantId, weight_gram, originalPrice, inStock, typePromotion, valuePromotion, ...otherInf}]
  const map = {};
  for (const r of rows) {
    const key = r.variantId;
    const {
      weight_gram,
      originalPrice,
      inStock,
      typePromotion,
      valuePromotion,
      promotionId,
      ...orderInf
    } = r;
    if (!map[key]) {
      map[key] = {
        variantId: key,
        weight_gram,
        originalPrice,
        price: originalPrice,
        inStock,
        discountFixed: 0,

        ...(forOrder && {
          typePromotion: null,
          valuePromotion: null,
        }),

        ...orderInf,
      };
    }

    let discountFixed = 0;

    if (typePromotion && valuePromotion) {
      if (
        typePromotion === "FIXED" &&
        valuePromotion > 0 &&
        valuePromotion < originalPrice
      ) {
        discountFixed = valuePromotion;
      }

      if (
        typePromotion === "PERCENT" &&
        valuePromotion > 0 &&
        valuePromotion < 100
      ) {
        discountFixed = (valuePromotion / 100) * originalPrice;
      }
    }

    // nếu có nhiều promotion thì lấy cái giảm nhiều nhất
    if (discountFixed > map[key].discountFixed) {
      map[key].discountFixed = discountFixed;
      map[key].price = originalPrice - discountFixed;

      if (forOrder) {
        map[key].typePromotion = typePromotion;
        map[key].valuePromotion = valuePromotion;
      }
    }
  }

  return Object.values(map);
}

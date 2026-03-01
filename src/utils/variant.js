export function groupVariant(rows, forOrder = false) {
  // rows: [{variantId, weight_gram, originalPrice, inStock, typePromotion, valuePromotion, ...otherInf}]
  // forOrder để khi group variant thì có cả 2 trường typePromotion và valuePromotion để khi tạo order mình sẽ tính lại giá bán
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

    map[key].discountFixed = discountFixed;
    map[key].price = originalPrice - discountFixed;

    if (forOrder) {
      map[key].typePromotion = typePromotion;
      map[key].valuePromotion = valuePromotion;
    }
  }

  return Object.values(map);
}
export function getPriceRange(rows) {
  // rows: [{variant}]

  let minPrice = Infinity;
  let maxPrice = 0;

  for (const variant of rows) {
    const { price } = variant;
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);
  }
  return { minPrice, maxPrice };
}

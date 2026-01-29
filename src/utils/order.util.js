const calculateOrderValues = (cartItems, orderId) => {
  let totalPriceOrder = 0;
  const orderValues = cartItems.map((item) => {
    const totalPriceItem = item.quantity * item.price;
    totalPriceOrder += totalPriceItem;
    if (item.quantity < 0) throw new Error("QUANTITY_ORDER_NEGATIVE");
    return [orderId, item.foodId, item.quantity, totalPriceItem];
  });
  return { orderValues, totalPriceOrder };
};

function generateOrderCode(orderId) {
  const year = new Date().getFullYear();
  const padded = orderId.toString().padStart(6, "0");
  return `DH${year}-${padded}`;
}

function groupOrders(rows) {
  // rows = [{orderId, orderCode, status, time, amount, orderItemId, foodName, image, weight_gram, totalPrice, quantity}]
  if (rows.length === 0) return [];
  const mapOrder = new Map();
  for (const order of rows) {
    const {
      orderId,
      orderCode,
      status,
      time,
      amount,
      orderItemId,
      foodName,
      image,
      weight_gram,
      totalPrice,
      quantity,
    } = order;

    // Nếu order chưa tồn tại
    if (!mapOrder.has(orderId)) {
      mapOrder.set(orderId, {
        orderId,
        orderCode,
        status,
        time,
        amount,
        featuredItem: {
          orderItemId,
          foodName,
          image,
          weight_gram,
          totalPrice: Number(totalPrice),
          quantity,
        },
      });
      continue;
    }

    // So sánh để chọn featuredItem
    const currentOrder = mapOrder.get(orderId);

    if (currentOrder.featuredItem.totalPrice < Number(totalPrice)) {
      currentOrder.featuredItem = {
        orderItemId,
        foodName,
        image,
        weight_gram,
        totalPrice: Number(totalPrice),
        quantity,
      };
    }
  }

  return Array.from(mapOrder.values());
}

module.exports = {
  calculateOrderValues,
  generateOrderCode,
  groupOrders,
};

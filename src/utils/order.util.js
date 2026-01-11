const calculateOrderValues = (cartItems, orderId) => {
  let totalPriceOrder = 0;
  const orderValues = cartItems.map((item) => {
    const totalPriceItem = (item.weight / 1000) * item.price; // giá trên 1 kg mà weight có thể là bé gram
    totalPriceOrder += totalPriceItem;
    if (item.weight < 0) throw new Error("WEIGHT_ORDER_NEGATIVE");
    return [orderId, item.foodId, item.weight, totalPriceItem];
  });
  return { orderValues, totalPriceOrder };
};

function generateOrderCode(orderId) {
  const year = new Date().getFullYear();
  const padded = orderId.toString().padStart(6, "0");
  return `DH${year}-${padded}`;
}

module.exports = {
  calculateOrderValues,
  generateOrderCode,
};

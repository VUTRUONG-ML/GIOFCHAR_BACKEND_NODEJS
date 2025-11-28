const calculateOrderValues = (cartItems, orderId) => {
  let totalPriceOrder = 0;
  const orderValues = cartItems.map((item) => {
    const totalPriceItem = item.quantity * item.price;
    totalPriceOrder += totalPriceItem;
    return [orderId, item.foodId, item.quantity, totalPriceItem];
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

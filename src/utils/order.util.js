const calculateOrderValues = (cartItems, orderId) => {
  let totalPriceOrder = 0;
  const orderValues = cartItems.map((item) => {
    const totalPriceItem = item.quantity * item.price;
    totalPriceOrder += totalPriceItem;
    return [orderId, item.foodId, item.quantity, totalPriceItem];
  });
  return { orderValues, totalPriceOrder };
};

module.exports = {
  calculateOrderValues,
};

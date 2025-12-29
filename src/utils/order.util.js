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

const statusOverview = (resultToday, resultYes) => {
  let status = "increase" | "decrease" | "no_change";
  let percent = 0;
  const diff = resultToday - resultYes;
  if (resultToday === 0 && resultYes === 0)
    return { status: "no_change", percent: 0 };
  if (resultToday !== 0 && resultYes === 0)
    return { status: "increase", percent: 100 };
  percent = (Math.abs(resultToday - resultYes) / resultYes) * 100;
  status = diff > 0 ? "increase" : diff < 0 ? "decrease" : "no_change";
  return { status, percent };
};

module.exports = {
  calculateOrderValues,
  generateOrderCode,
  statusOverview,
};

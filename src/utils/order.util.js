const calculateOrderValues = (cartItems, orderId) => {
  let totalPriceOrder = 0;

  const orderValues = cartItems.map((item) => {
    const unitPrice = item.price; // finalPrice
    const totalPriceItem = unitPrice * item.quantity;
    totalPriceOrder += totalPriceItem;

    return [
      orderId,

      item.variantId,

      item.foodName, // item_name
      item.weight_gram,

      item.originalPrice,
      item.typePromotion ?? null,
      item.valuePromotion ?? null,
      item.discountFixed, // discount_amount

      unitPrice,
      item.quantity,
      totalPriceItem,
    ];
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
        amount: Number(amount),
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

function groupOrderDetail(rows) {
  // rows = [{orderId, orderCode, createdAt, updatedAt, customerName, email, phone, address, status, orderItemId, foodName, image, weight_gram, quantity, price, totalPriceOnOneItem, paymentType, paymentStatus}]
  if (rows.length === 0) return null;
  const {
    orderId,
    createdAt,
    updatedAt,
    orderCode,
    status,
    customerName,
    email,
    phone,
    paymentType,
    paymentStatus,
    address,
  } = rows[0];

  const itemList = rows.map(
    ({
      orderId,
      createdAt,
      updatedAt,
      orderCode,
      status,
      customerName,
      email,
      phone,
      paymentType,
      paymentStatus,
      address,
      ...rest
    }) => ({
      ...rest,
      unitPrice: Number(rest.unitPrice),
      totalPriceOnOneItem: Number(rest.totalPriceOnOneItem),
    }),
  );

  //tinh tong tien cua order
  const amountOrder = itemList.reduce(
    (sum, item) => sum + Number(item.totalPriceOnOneItem),
    0,
  );
  const order = {
    orderId,
    totalItem: itemList.length,
    orderCode,
    createdAt,
    updatedAt,
    orderStatus: status,
    address,
    amountOrder,
    customerName,
    phone,
    email,
    paymentType,
    paymentStatus,
    items: itemList,
  };
  return order;
}

module.exports = {
  calculateOrderValues,
  generateOrderCode,
  groupOrders,
  groupOrderDetail,
};

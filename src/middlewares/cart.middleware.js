const cartService = require("../services/cart.service");
const cartItemService = require("../services/cartItem.service");

const ensureCart = async (req, res, next) => {
  const userId = req.params.userId; // sau này đổi lại thành req.userId
  try {
    let cartId;
    const carts = await cartService.getCartByUserId(userId);
    if (carts.length) {
      cartId = carts[0].id;
    } else {
      const result = await cartService.createCart(userId);
      cartId = result.insertId;
    }

    req.cartId = cartId;
    next();
  } catch (err) {
    console.log(">>>>> MIDDLEWARE ERROR", err.message);
    res
      .status(500)
      .json({ message: "Failed to get or create cart", error: err.message });
  }
};

module.exports = { ensureCart };

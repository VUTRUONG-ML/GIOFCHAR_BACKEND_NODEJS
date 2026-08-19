import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import cartService from "../../src/services/cart.service.js";
import cartItemService from "../../src/services/cartItem.service.js";
import pool from "../../src/config/db.js";

// Mock cartItemService
vi.mock("../../src/services/cartItem.service.js", () => ({
  default: {
    getCartItemsByCartId: vi.fn(),
    findCartItem: vi.fn(),
    updateCartItemQuantity: vi.fn(),
    insertCartItem: vi.fn(),
    deleteCartItem: vi.fn(),
  },
}));

// Mock Connection Pool cho DB Transaction
const mockConnection = {
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
  execute: vi.fn(),
};

vi.mock("../../src/config/db.js", () => ({
  default: {
    getConnection: vi.fn(() => Promise.resolve(mockConnection)),
    execute: vi.fn(),
  },
}));

describe("cartService.mergeGuestCartToUser (Unit Tests)", () => {
  const MOCK_USER_ID = 20;
  const MOCK_GUEST_TOKEN = "guest-token-uuid-1234";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Scenario 1: Converts guest cart directly to user cart when user has no existing cart", async () => {
    // 1. mockConnection.execute lần 1 (User cart): không có -> []
    // 2. mockConnection.execute lần 2 (Guest cart): có giỏ hàng id = 10 -> [{ id: 10, guestToken: MOCK_GUEST_TOKEN }]
    // 3. mockConnection.execute lần 3 (UPDATE carts): thành công
    mockConnection.execute
      .mockResolvedValueOnce([[]]) // getCart User -> null
      .mockResolvedValueOnce([[{ id: 10, guestToken: MOCK_GUEST_TOKEN }]]) // getCart Guest -> cart 10
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE carts

    const result = await cartService.mergeGuestCartToUser({
      userId: MOCK_USER_ID,
      guestToken: MOCK_GUEST_TOKEN,
    });

    expect(result).toBe(true);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.execute).toHaveBeenCalledWith(
      `UPDATE carts SET userID = ?, guestToken = NULL WHERE guestToken = ?`,
      [MOCK_USER_ID, MOCK_GUEST_TOKEN]
    );
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });

  it("Scenario 2: Merges guest cart items into existing user cart (combining quantities & adding new items)", async () => {
    const userCart = { id: 1, userID: MOCK_USER_ID };
    const guestCart = { id: 10, guestToken: MOCK_GUEST_TOKEN };

    const guestItems = [
      { id: 101, variantId: 1, quantity: 3 }, // Món 1: Đã có trong giỏ User (sl = 2)
      { id: 102, variantId: 2, quantity: 1 }, // Món 2: Chưa có trong giỏ User
    ];

    // getCart(User) -> userCart (id: 1)
    // getCart(Guest) -> guestCart (id: 10)
    // clearCart -> DELETE FROM carts WHERE id = 10
    mockConnection.execute
      .mockResolvedValueOnce([[userCart]])
      .mockResolvedValueOnce([[guestCart]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete guest cart

    cartItemService.getCartItemsByCartId.mockResolvedValue(guestItems);

    // Món 1 (variantId = 1): Tìm thấy trong giỏ User -> existed item id = 50
    cartItemService.findCartItem
      .mockResolvedValueOnce({ id: 50, cartID: 1, food_variantID: 1, quantity: 2 })
      // Món 2 (variantId = 2): Không tìm thấy -> null
      .mockResolvedValueOnce(null);

    const result = await cartService.mergeGuestCartToUser({
      userId: MOCK_USER_ID,
      guestToken: MOCK_GUEST_TOKEN,
    });

    expect(result).toBe(true);
    expect(cartItemService.getCartItemsByCartId).toHaveBeenCalledWith(10, mockConnection);

    // Kiểm tra món 1 được cộng dồn số lượng thêm 3
    expect(cartItemService.updateCartItemQuantity).toHaveBeenCalledWith(
      50,
      3,
      mockConnection
    );

    // Kiểm tra món 2 được thêm mới với số lượng 1
    expect(cartItemService.insertCartItem).toHaveBeenCalledWith(
      1,
      2,
      1,
      mockConnection
    );

    // Kiểm tra giỏ hàng Guest bị xóa sau khi gộp
    expect(mockConnection.execute).toHaveBeenCalledWith(
      "DELETE FROM carts WHERE id = ?",
      [10]
    );
    expect(mockConnection.commit).toHaveBeenCalled();
  });

  it("Scenario 3: Returns early and commits when guest cart does not exist", async () => {
    // getCart(User) -> userCart (id: 1)
    // getCart(Guest) -> null
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1, userID: MOCK_USER_ID }]])
      .mockResolvedValueOnce([[]]);

    const result = await cartService.mergeGuestCartToUser({
      userId: MOCK_USER_ID,
      guestToken: MOCK_GUEST_TOKEN,
    });

    expect(result).toBeUndefined();
    expect(cartItemService.getCartItemsByCartId).not.toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
  });

  it("Scenario 4: Triggers transaction rollback when a database error occurs during merge", async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1, userID: MOCK_USER_ID }]])
      .mockResolvedValueOnce([[{ id: 10, guestToken: MOCK_GUEST_TOKEN }]]);

    cartItemService.getCartItemsByCartId.mockRejectedValue(
      new Error("Database connection lost")
    );

    const result = await cartService.mergeGuestCartToUser({
      userId: MOCK_USER_ID,
      guestToken: MOCK_GUEST_TOKEN,
    });

    expect(result).toBe(false);
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });
});

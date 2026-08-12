import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/services/cartItem.service.js", () => ({
    default: {
        getCartItemsByCartId: vi.fn(),
    },
}));

vi.mock("../../src/services/variant.service.js", () => ({
    deductStockForOrder: vi.fn(),
}));

vi.mock("../../src/services/payment.service.js", () => ({
    default: {
      createPayment: vi.fn(),
    },
}));

vi.mock("../../src/services/cart.service.js", () => ({
    default: {
      clearCart: vi.fn(),
    },
}));

vi.mock("../../src/services/order_item.service.js", () => ({
    default: {
      createOrderItem: vi.fn(),  
    }
}))

vi.mock("../../src/services/payments/vnpay.service.js", () => ({
    buildVnpayPaymentUrl: vi.fn(),
}))
import cartItemService from "../../src/services/cartItem.service.js";
import orderService from "../../src/services/order.service.js";
import cartService from "../../src/services/cart.service.js";
import { deductStockForOrder } from "../../src/services/variant.service.js";
import paymentService from "../../src/services/payment.service.js";
import order_itemService from "../../src/services/order_item.service.js";
import { buildVnpayPaymentUrl } from "../../src/services/payments/vnpay.service.js";
import { vnpayConfig } from "../../src/config/vnpay.js";

describe("orderService.checkout", () => {
    const conn = {
      execute: vi.fn(),
    };

    const checkoutInput = {
      cartId: 1,
      customerName: "Nguyen Van A",
      email: "a@example.com",
      phone: "0900000000",
      address: "Ho Chi Minh City",
      paymentMethod: "COD",
      userId: 20,
      guestToken: undefined,
      ipAddr: "127.0.0.1",
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("throws CART_EMPTY when the cart has no items", async () => {
        cartItemService.getCartItemsByCartId.mockResolvedValue([]);

        await expect(
            orderService.checkout(checkoutInput, conn),
        ).rejects.toMatchObject({
            statusCode: 400,
            context: {
            reason: "CART_EMPTY",
            cartId: 1,
            },
        });

        expect(cartItemService.getCartItemsByCartId).toHaveBeenCalledWith(
            1,
            conn,
            true,
        );
        expect(deductStockForOrder).not.toHaveBeenCalled();
        expect(order_itemService.createOrderItem).not.toHaveBeenCalled();
        expect(paymentService.createPayment).not.toHaveBeenCalled();
        expect(cartService.clearCart).not.toHaveBeenCalled();
        expect(conn.execute).not.toHaveBeenCalled(); // createOrder - service 
    });

    it("processes COD payment successfully", async () => {
        cartItemService.getCartItemsByCartId.mockResolvedValue([
            {
                variantId: 10,
                foodName: "Burger",
                weight_gram: 150,
                originalPrice: 50000,
                price: 45000,
                quantity: 2,
                discountFixed: 0,
            },
        ]);
        
        // Giả lập kết quả thực thi SQL cho createOrder
        conn.execute
            .mockResolvedValueOnce([{ insertId: 99 }]) // INSERT order
            .mockResolvedValueOnce([]); // UPDATE orderCode

        // Giả lập tạo payment
        paymentService.createPayment.mockResolvedValue({ insertId: 202 });

        const result = await orderService.checkout(checkoutInput, conn);

        // 1. Kiểm tra kết quả trả về
        const currentYear = new Date().getFullYear();
        expect(result).toEqual({
            orderId: 99,
            orderCode: `DH${currentYear}-000099`,
            totalPriceOrder: 90000, // 45000 * 2
            paymentUrl: "",
            paymentId: 202,
            paymentStatus: "pending",
        });

        // 2. Kiểm tra thứ tự gọi: Phải trừ kho hàng (deductStockForOrder) TRƯỚC KHI tạo order (conn.execute)
        expect(deductStockForOrder.mock.invocationCallOrder[0])
            .toBeLessThan(conn.execute.mock.invocationCallOrder[0]);

        // 3. Kiểm tra các hàm dependency được gọi với đúng tham số
        expect(deductStockForOrder).toHaveBeenCalledWith(conn, expect.any(Array));
        //orderId, variantId, foodName, weight_gram, originalPrice, price, discountFixed, discountPercent, totalPrice, quantity, foodId
        expect(order_itemService.createOrderItem).toHaveBeenCalledWith(conn, [
            [99, 10, "Burger", 150, 50000, null, null, 0, 45000, 2, 90000]
        ]);
        expect(paymentService.createPayment).toHaveBeenCalledWith(
            conn,
            99,
            "COD",
            90000,
            "COD",
            "pending",
        );
        expect(cartService.clearCart).toHaveBeenCalledWith(1, conn);
    });

    it("processes VNPAY payment successfully", async () => {
        cartItemService.getCartItemsByCartId.mockResolvedValue([
            {
                variantId: 10,
                foodName: "Burger",
                weight_gram: 150,
                originalPrice: 50000,
                price: 45000,
                quantity: 2,
                discountFixed: 0,
            },
        ]);
        const checkoutInputCARD = {
            cartId: 1,
            customerName: "Nguyen Van A",
            email: "a@example.com",
            phone: "0900000000",
            address: "Ho Chi Minh City",
            paymentMethod: "CARD",
            userId: 20,
            guestToken: undefined,
            ipAddr: "127.0.0.1",
        };
        // Giả lập kết quả thực thi SQL cho createOrder
        conn.execute
            .mockResolvedValueOnce([{ insertId: 100 }]) // INSERT order
            .mockResolvedValueOnce([]); // UPDATE orderCode

        // Giả lập tạo payment
        paymentService.createPayment.mockResolvedValue({ insertId: 205 });
        buildVnpayPaymentUrl.mockReturnValue(vnpayConfig.vnpUrl);

        const result = await orderService.checkout(checkoutInputCARD, conn);

        // 1. Kiểm tra kết quả trả về
        const currentYear = new Date().getFullYear();
        expect(result).toEqual({
            orderId: 100,
            orderCode: `DH${currentYear}-000100`,
            totalPriceOrder: 90000, // 45000 * 2
            paymentUrl: vnpayConfig.vnpUrl,
            paymentId: 205,
            paymentStatus: "pending",
        });

        // 2. Kiểm tra thứ tự gọi: Phải trừ kho hàng (deductStockForOrder) TRƯỚC KHI tạo order (conn.execute)
        expect(deductStockForOrder.mock.invocationCallOrder[0])
            .toBeLessThan(conn.execute.mock.invocationCallOrder[0]);

        // 3. Kiểm tra các hàm dependency được gọi với đúng tham số
        expect(deductStockForOrder).toHaveBeenCalledWith(conn, expect.any(Array));
        expect(order_itemService.createOrderItem).toHaveBeenCalledWith(conn, [
            [100, 10, "Burger", 150, 50000, null, null, 0, 45000, 2, 90000]
        ]);
        expect(paymentService.createPayment).toHaveBeenCalledWith(
            conn,
            100,
            "CARD",
            90000,
            "",
            "pending",
        );
        expect(buildVnpayPaymentUrl).toHaveBeenCalledWith({
            orderId: `DH${currentYear}-000100`,
            amount: 90000,
            ipAddr: "127.0.0.1",
        });
        expect(cartService.clearCart).toHaveBeenCalledWith(1, conn);
    });

    it("throws OUT_OF_STOCK error and halts execution if stock is insufficient", async () => {
        cartItemService.getCartItemsByCartId.mockResolvedValue([
            {
                variantId: 10,
                foodName: "Burger",
                weight_gram: 150,
                originalPrice: 50000,
                price: 45000,
                quantity: 2,
                discountFixed: 0,
            },
        ]);

        // Giả lập deductStockForOrder ném ra lỗi hết hàng (OutOfStock)
        const mockError = new Error("Insufficient stock for product");
        mockError.statusCode = 409;
        mockError.code = "OUT_OF_STOCK";
        deductStockForOrder.mockRejectedValue(mockError);

        await expect(
            orderService.checkout(checkoutInput, conn)
        ).rejects.toThrow("Insufficient stock for product");

        // Đảm bảo không tạo order, không tạo payment, không xóa giỏ hàng
        expect(conn.execute).not.toHaveBeenCalled();
        expect(order_itemService.createOrderItem).not.toHaveBeenCalled();
        expect(paymentService.createPayment).not.toHaveBeenCalled();
        expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it("propagates database errors and halts execution if INSERT order fails", async () => {
        cartItemService.getCartItemsByCartId.mockResolvedValue([
            {
                variantId: 10,
                foodName: "Burger",
                weight_gram: 150,
                originalPrice: 50000,
                price: 45000,
                quantity: 2,
                discountFixed: 0,
            },
        ]);

        // Giả lập deductStockForOrder chạy thành công
        deductStockForOrder.mockResolvedValue(true);

        // Giả lập conn.execute ném ra lỗi Database
        const dbError = new Error("Database connection lost");
        dbError.code = "ER_CON_COUNT_ERROR";
        conn.execute.mockRejectedValue(dbError);

        await expect(
            orderService.checkout(checkoutInput, conn)
        ).rejects.toThrow("Database connection lost");

        // Đảm bảo không tạo order item, không tạo payment, không xóa giỏ hàng
        expect(order_itemService.createOrderItem).not.toHaveBeenCalled();
        expect(paymentService.createPayment).not.toHaveBeenCalled();
        expect(cartService.clearCart).not.toHaveBeenCalled();
    });
});
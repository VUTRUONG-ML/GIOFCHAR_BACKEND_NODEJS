# Giofchar Express SQL Backend

## 1. System Architecture

Dự án áp dụng mô hình **Layered Architecture** (Kiến trúc phân tầng) vững chắc, tách biệt rõ ràng các nhiệm vụ, giúp code dễ đọc, dễ bảo trì và dễ mở rộng (scale):

**Route -> Middleware -> Controller -> Service**

- **Routes (`src/routes`)**: Chịu trách nhiệm định tuyến các request đến các controller tương ứng. Route cũng là nơi gắn các Middleware như xác thực (Auth), phân quyền (Roles) hay xử lý File Upload.
- **Middlewares (`src/middlewares`)**: Lớp trung gian chặn bắt và xử lý dữ liệu trước khi nhảy vào Controller. Tại đây, dự án thực hiện việc xác thực `JWT token`, check quyền `admin`, phân tích `X-Guest-Token`, và xử lý các dịch vụ tích hợp như Cloudinary upload.
- **Controllers (`src/controllers`)**: Controller được thiết kế rất "mỏng" (Thin Controller), chỉ đóng vai trò tiếp nhận `req`, `res`, `next`. Controller nhận nhiệm vụ trích xuất dữ liệu (body, params, query, user profile từ middleware) và truyền sang cho Service. Thường Controller không can thiệp sâu vào logic dữ liệu.
- **Services (`src/services`)**: Nơi tập trung toàn bộ "chất xám" của ứng dụng. Mọi tương tác trực tiếp tới Database (Database Queries, Transactions), thuật toán xử lý luồng, việc kiểm tra tính hợp lệ nghiệp vụ đều được đặt ở lớp Service. Việc bóc tách này giúp tái sử dụng lại các hàm trong Service ở bất kỳ đâu trong dự án.

---

## 2. API Endpoints & Data Flow

Dưới đây là luồng Data flow chính của các Domain/Entities cốt lõi của hệ thống:

### Users API
| Method | Endpoint | Description | Auth Required | Expected Response / Payload |
|:---:|---|---|:---:|---|
| `GET` | `/users` | Lấy danh sách toàn bộ hệ thống Users | Admin | `[ { id, email, role, customerName... } ]` |
| `GET` | `/users/:userId` | Xem chi tiết thông tin một User | Guest/No | `{ id, email, customerName, phone... }` |
| `PUT` | `/users/updateMyInfo` | Cập nhật hồ sơ cá nhân | Yes | **Payload:** `{ phone, address... }`<br>**Res:** Thâm báo thành công |
| `POST` | `/users` | Admin chủ động tạo mới một User | Admin | **Payload:** `{ email, password, role }` |

### Foods (Products) API
| Method | Endpoint | Description | Auth Required | Expected Response / Payload |
|:---:|---|---|:---:|---|
| `GET` | `/foods` | Lấy danh sách sản phẩm | Guest/No | `[ { id, foodName, image, category... } ]` |
| `GET` | `/foods/:foodId` | Xem chi tiết món và danh sách Variant | Guest/No | `{ id, foodName, variants: [...] }` |
| `POST` | `/foods` | Thêm mới món ăn (kèm file Upload) | Admin | **Payload:** `FormData` (`imageFood`, `foodName`...) |
| `PUT` | `/foods/:foodId` | Cập nhật thông tin món ăn / Hình ảnh | Admin | **Payload:** `FormData` (có thể update file ảnh) |

### Carts API
| Method | Endpoint | Description | Auth Required | Expected Response / Payload |
|:---:|---|---|:---:|---|
| `GET` | `/carts/my-cartItems` | Giỏ hàng cá nhân | Yes/Guest | `[ { variantId, quantity, totalPrice... } ]` |
| `POST` | `/carts/cartItem` | Thêm items vào giỏ hàng | Yes/Guest | **Payload:** `{ variantId, quantity }` |
| `DELETE` | `/carts/:cartItemId` | Bỏ 1 sản phẩm khỏi giỏ hàng | Yes/Guest | JSON `{ message: "Success" }` |
| `DELETE` | `/carts` | Reset / Làm sạch giỏ hàng | Yes/Guest | JSON `{ message: "Cart cleared" }` |

### Orders API
| Method | Endpoint | Description | Auth Required | Expected Response / Payload |
|:---:|---|---|:---:|---|
| `POST` | `/orders/user/cod` | Đặt hàng cho tài khoản đã login | Yes | **Payload:** `{ customerName, email, phone, address, cartId }` |
| `POST` | `/orders/guest/cod` | Đặt hàng dưới dạng vãng lai | Guest | **Payload:** Giống như trên |
| `GET` | `/orders/user/my-orders` | Trích xuất lịch sử đơn hàng | Yes | `[ { orderId, orderCode, amount, status... } ]` |
| `GET` | `/orders` | Tổng hợp thông tin Orders hệ thống | Admin | Danh sách thống kê tất cả Đơn hàng |

---

## 3. API Security & Authentication

- **JWT (JSON Web Tokens)**: Quá trình xác thực phiên người dùng chạy hoàn toàn qua stateless JWT. Backend cấp `accessToken` (được ký bằng `ACCESS_TOKEN_SECRET`). Tầng Middleware (`requireAuth`) sẽ bóc tách `Bearer Token`, xác minh và pass định danh qua biến `req.user` dành cho Controller.
- **Role-based Access Control (RBAC)**: Phân ranh giới quyền sắc nét. Các route nhạy cảm được chèn thêm middleware `checkAdmin`, bảo đảm người dùng thường không thể chỉnh sửa Menu, Giá cả hay xem Báo cáo doanh thu.
- **Guest Session qua `X-Guest-Token` & Merge Cart**:
  - Không bắt ép khách hàng phải tạo tài khoản ngay lập tức. Nếu Request đi lướt qua chưa có JWT, middleware `optionalAuth` sẽ đọc header thông qua `x-guest-token` và nhận diện đây là một "Guest Session".
  - Với Guest Token, khách vãng lai đã có thể lưu giỏ hàng `carts` (thông qua `guestToken` identifier) và tiến hành đặt hàng `orders` trơn tru. Khi khách quyết định Đăng ký hoặc Đăng nhập, hệ thống sẽ thực hiện luồng đồng bộ "Merge Cart" và liên kết các hóa đơn khách đã đặt (Attach Order to User) xuyên suốt từ guest sang tài khoản chính thức. 

---

## 4. Technical Highlights

- **Centralized Error Handling**: Thay vì rải rác cú pháp `try-catch` lặp lại trên toàn bộ ứng dụng, code base sử dụng hàm Wrapper `asyncHandler` ở các routes tích hợp chạy với Error Middleware (trong `src/errors/errorHandler.js`). Mọi lỗi Logic (thông qua Custom Error Class như `BadRequestError`, `NotFoundError`) đến lỗi Database sẽ được gom về một mối xử lý và format dạng JSON chuẩn nhất để response về Frontend. 
- **Database Transactions & Anti Race Condition**: 
  - Do bài toán thương mại điện tử khá khắc nghiệt ở pha Checkout, các hàm Service nghiệp vụ cao dùng Transaction cứng (`conn.beginTransaction()`). 
  - Toàn bộ flow như: *Update Stock -> Khởi tạo Order -> Tạo Order Items -> Gắn phương thức Payment -> Clear Cart* diễn ra nguyên vẹn và atomic.
  - Vấn đề quá dòng đặt hàng (Race Condition) được xử lý thông qua Row Locking (`FOR UPDATE` reads) hoặc bằng Atomic Updates tự thân của hệ CSDL quan hệ (`UPDATE food_variants SET stock = stock - ? WHERE id = ? AND stock >= ?` - nếu kho không đủ sẽ gây fail query), đảm bảo không bao giờ có hiện tượng Overselling kho.
- **Connection Pool Management**: Không kết nối DB tùy tiện. Tận dụng `mysql2/promise` thông qua hệ đệm với `connectionLimit: 10`, `maxIdle: 10`, và auto `idleTimeout`. Vừa giúp CSDL duy trì Performance ở lượng người truy cập cao, vừa không bị sập tràn Connection.

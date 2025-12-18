# Gio Cha Web – Backend API

Backend API cho website bán giò chả – dùng cho FE call trực tiếp.

---

## 1. Base URL

- Local: `http://localhost:8081/api`
- Production: chưa triển khai

---

## 2. Authentication

### Admin

- JWT token
- Header: `Authorization: Bearer <access_token>`

### Client

- Không cần đăng nhập
- Header: `x-guest-token: <uuid>`
- Nếu chưa gửi, backend sẽ tạo và trả lại trong response header

---

## 3. Common Headers

Content-Type: application/json
x-guest-token: <guestToken> // client only
Authorization: Bearer <access_token>

---

## 4.Auth APIs

### 4.1. GET /auth/account

Lấy thông tin tài khoản hiện tại (yêu cầu đăng nhập)

#### Header

| Key           | Value               |
| ------------- | ------------------- |
| Authorization | Bearer access_token |

#### Response

##### Success (200)

```json
{
  "userName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "role": "admin || user"
}
```

### 4.2. POST /auth/login

Đăng nhập hệ thống

#### Body

```json
{
  "email": "string",
  "password": "string"
}
```

#### Response

##### Success (200)

```json
{
    "message": "Login successful",
    "data": {
        "access_token": "string",
        "user": {...}
    }
}
```

### 4.3 POST /auth/register

Đăng ký tài khoản

#### Body

```json
{
  "userName": "string",
  "email": "string",
  "password": "string",
  "phone": "string"
}
```

#### Response

##### Success(200)

```json
{
  "message": "Register successful",
  "userId": "number"
}
```

---

## 5. Botchat APIs

### POST /botchat

Chatbot tư vấn / hỗ trợ khách hàng

#### Body

```json
{
  "message": "string"
}
```

#### Response(200)

```json
{
  "intent": "string",
  "reply": "string"
}
```

---

## 6. Cart APIs

### 6.1.GET /cart/my-cartItems

Lấy danh sách sản phẩm trong giỏ hàng  
(Có thể đăng nhập hoặc không đăng nhập)

> Headers: Authorization (optional), x-guest-token

#### Response(200) - Có sản phẩm trong giỏ hàng

```json
{
  "message": "Success",
  "cartItems": [
    {
      "cartItemsId": "number",
      "foodId": "number",
      "foodName": "string",
      "image": "string",
      "price": "number",
      "quantity": "number",
      "cartID": "number"
    }
  ]
}
```

#### Response(200) - Không có sản phẩm trong giỏ hàng

```json
{
  "message": "Empty carts",
  "cartItems": []
}
```

### 6.2 POST /cart/cartItem

Thêm sản phẩm vào giỏ hàng  
(Có thể đăng nhập hoặc không đăng nhập)

> Headers: Authorization (optional), x-guest-token

#### Body

```json
{
  "foodId": "number",
  "quantity": "number"
}
```

#### Response(200)

```json
{
  "message": "string",
  "cartId": "number",
  "foodId": "number",
  "quantity": "number"
}
```

### 6.3 DELETE /cart/:cartItemId

Xóa một sản phẩm khỏi giỏ hàng  
(Có thể đăng nhập hoặc không đăng nhập)

> Headers: Authorization (optional), x-guest-token

#### Params

| Key        | Type   |
| ---------- | ------ |
| cartItemId | number |

#### Response (200)

```json
{
  "message": "Delete cart item successful"
}
```

### 6.4 DELETE /cart

Xóa toàn bộ sản phẩm trong giỏ hàng  
(Có thể đăng nhập hoặc không đăng nhập)

> Headers: Authorization (optional), x-guest-token

#### Response (200)

```json
{
  "message": "Clear cart successful"
}
```

---

## 7. Category APIs

### 7.1 GET /categories

Lấy danh sách danh mục sản phẩm  
(Có thể đăng nhập hoặc không đăng nhập)

> Headers: Authorization (optional), x-guest-token

#### Response (200) – Admin

```json
{
  "quantity": "number",
  "categories": [
    {
      "categoryID": "number",
      "categoryName": "string",
      "categoryDescription": "string",
      "quantityFood": "number"
    }
  ]
}
```

#### Response (200) - Client

```json
{
  "quantity": "number",
  "categories": [
    {
      "categoryID": "number",
      "categoryName": "string"
    }
  ]
}
```

### 7.2 GET /categories/:categoryId

Lấy chi tiết thông tin danh mục theo ID  
(Chỉ dành cho Admin)

> Headers: Authorization

#### Params

| Key        | Type   |
| ---------- | ------ |
| categoryId | number |

#### Response (200)

```json
{
  "id": "number",
  "categoryName": "string",
  "categoryDescription": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### 7.3 POST /categories

Tạo mới danh mục  
(Chỉ dành cho Admin)

> Headers: Authorization

#### Body

```json
{
  "categoryName": "string",
  "categoryDescription": "string"
}
```

#### Response (201)

```json
{
  "message": "Create category successful",
  "categoryId": "number"
}
```

### 7.4 PUT /categories/:categoryId

Cập nhật thông tin danh mục
(Chỉ dành cho Admin)

> Headers: Authorization

#### Params

| Key        | Type   |
| ---------- | ------ |
| categoryId | number |

#### Body

```json
{
  "categoryName": "string",
  "categoryDescription": "string"
}
```

#### Response (201)

```json
{
  "message": "Update category successful"
}
```

### 7.5 DELETE /categories/:categoryId

Xóa danh mục theo ID
(Chỉ dành cho Admin)

> Headers: Authorization

#### Params

| Key        | Type   |
| ---------- | ------ |
| categoryId | number |

#### Response (200)

```json
{
  "message": "Delete category successful"
}
```

---

## 8. Food APIs

### 8.1 GET /foods

Lấy danh sách món ăn  
(Có thể đăng nhập hoặc không đăng nhập)

> Headers: Authorization (optional)

#### Response (200) – Admin

```json
{
  "quantity": "number",
  "foods": [
    {
      "foodId": "number",
      "foodName": "string",
      "foodDescription": "string",
      "price": "number",
      "stock": "number",
      "isActive": "number",
      "image": "string",
      "categoryID": "number",
      "categoryName": "string"
    }
  ]
}
```

#### Response (200) – Client

```json
{
  "quantity": "number",
  "foods": [
    {
      "foodId": "number",
      "foodName": "string",
      "price": "number",
      "discount": "number",
      "rating": "number",
      "isActive": "number",
      "image": "string",
      "categoryID": "number",
      "categoryName": "string"
    }
  ]
}
```

### 8.2 GET /foods/:foodId

Lấy chi tiết thông tin món ăn  
(Có thể đăng nhập hoặc không đăng nhập)

> Headers: Authorization (optional)

#### Response (200) – Admin

```json
{
  "foodId": "number",
  "foodName": "string",
  "foodDescription": "string",
  "stock": "number",
  "imagePublicId": "string",
  "price": "number",
  "isActive": "number",
  "image": "string",
  "categoryID": "number",
  "categoryName": "string"
}
```

#### Response (200) - Client

```json
{
  "foodId": "number",
  "foodName": "string",
  "foodDescription": "string",
  "discount": "number",
  "rating": "number",
  "ingredients": "string",
  "price": "number",
  "isActive": "number",
  "image": "string",
  "categoryID": "number",
  "categoryName": "string"
}
```

### 8.3 POST /foods

Tạo mới món ăn  
(Chỉ dành cho admin)

> Headers: Authorization  
> Content-Type: multipart/form-data

#### Body (form-data)

| Key             | Type | Description         |
| --------------- | ---- | ------------------- |
| foodName        | Text | Tên món ăn          |
| foodDescription | Text | Mô tả món ăn        |
| price           | Text | Giá món ăn          |
| discount        | Text | Giảm giá (%)        |
| rating          | Text | Đánh giá            |
| stock           | Text | Số lượng tồn        |
| isActive        | Text | Trạng thái hiển thị |
| categoryID      | Text | ID danh mục         |
| imageFood       | File | Ảnh món ăn          |

#### Response (201) – Success

```json
{
  "message": "Create food successful",
  "foodId": "number"
}
```

### 8.4 PUT /foods/:foodId

Cập nhật thông tin món ăn  
(Chỉ dành cho admin)

> Headers: Authorization  
> Content-Type: multipart/form-data  
> imageFood: **optional**

#### Params

| Param  | Type   | Description |
| ------ | ------ | ----------- |
| foodId | number | ID món ăn   |

#### Body (form-data)

| Key             | Type | Required | Description              |
| --------------- | ---- | -------- | ------------------------ |
| foodName        | Text | No       | Tên món ăn               |
| foodDescription | Text | No       | Mô tả món ăn             |
| price           | Text | No       | Giá món ăn               |
| stock           | Text | No       | Số lượng tồn             |
| isActive        | Text | No       | Trạng thái hiển thị      |
| categoryID      | Text | No       | ID danh mục              |
| imageFood       | File | No       | Ảnh món ăn (có thể null) |

#### Response (200) – Success

```json
{
  "message": "Update food successful"
}
```

### 8.5 DELETE /foods/:foodId

Xóa món ăn  
(Chỉ dành cho admin)

> Headers: Authorization

#### Params

| Param  | Type   | Description |
| ------ | ------ | ----------- |
| foodId | number | ID món ăn   |

#### Response (200) – Success

```json
{
  "message": "Delete food successful"
}
```

---

## 9. Order APIs

### 9.1 GET /orders

Lấy danh sách tất cả đơn hàng  
(Chỉ dành cho admin)

> Headers: Authorization

#### Response (200) – Success

```json
{
  "total": "number",
  "orders": [
    {
      "orderId": "number",
      "orderCode": "string",
      "status": "string",
      "paymentStatus": "string",
      "customerName": "string",
      "email": "string",
      "phone": "string",
      "deliveryAddress": "string",
      "time": "string",
      "totalQuantity": "number",
      "amount": "number"
    }
  ]
}
```

### 9.2 GET /orders/user/:userId

Xem tất cả đơn hàng của một người dùng  
(Chỉ dành cho admin)

> Headers: Authorization

#### Params

| Param  | Type   | Description   |
| ------ | ------ | ------------- |
| userId | number | ID người dùng |

#### Response (200) – Success

```json
{
  "total": "number",
  "orders": [
    {
      "orderId": "number",
      "orderCode": "string",
      "status": "string",
      "paymentStatus": "string",
      "deliveryAddress": "string",
      "time": "string"
    }
  ]
}
```

### 9.3 GET /orders/user/my-orders

Xem tất cả đơn hàng của chính người dùng hiện tại  
(Yêu cầu đăng nhập)

> Headers: Authorization

#### Response (200) – Success

```json
{
  "total": "number",
  "orders": [
    {
      "orderId": "number",
      "orderCode": "string",
      "status": "string",
      "paymentStatus": "string",
      "deliveryAddress": "string",
      "time": "string"
    }
  ]
}
```

### 9.4 GET /orders/:orderId/detail

Xem chi tiết các sản phẩm trong đơn hàng  
(Khách / User / Admin đều có thể truy cập nếu được cấp quyền)

> Headers:
>
> - Authorization (optional)
> - x-guest-token (optional)

#### Params

| Param   | Type   | Description |
| ------- | ------ | ----------- |
| orderId | number | ID đơn hàng |

#### Response (200) – Success

```json
{
  "totalItem": "number",
  "orderCode": "string",
  "createdAt": "string",
  "orderStatus": "string",
  "address": "string",
  "amountOrder": "number",
  "customerName": "string",
  "phone": "string",
  "email": "string",
  "paymentType": "string",
  "paymentStatus": "string",
  "items": [
    {
      "orderId": "number",
      "orderItemId": "number",
      "quantity": "number",
      "totalPriceOnOneItem": "number",
      "foodId": "number",
      "foodName": "string",
      "image": "string",
      "price": "number"
    }
  ]
}
```

### 9.5 POST /orders/user/cod

Tạo đơn hàng (thanh toán COD) dành cho người dùng đã đăng nhập

> Headers: Authorization

#### Response (200) – Success

```json
{
  "message": "Create order successful",
  "orderId": "number",
  "totalPriceOrder": "number"
}
```

### 9.6 POST /orders/guest/cod

Tạo đơn hàng (thanh toán COD) dành cho khách
(Không cần đăng nhập)

> Headers: x-guest-token

#### Response (200) – Success

```json
{
  "message": "Create order successful",
  "orderId": "number",
  "totalPriceOrder": "number"
}
```

### 9.7 PUT /orders/:orderId/cancel

Hủy đơn hàng  
(Dành cho khách và người dùng – chỉ được hủy khi có quyền truy cập đơn hàng)

> Headers:
>
> - Authorization (optional)
> - x-guest-token (optional)

#### Params

| Param   | Type   | Description |
| ------- | ------ | ----------- |
| orderId | number | ID đơn hàng |

#### Response (200) – Success

```json
{
  "message": "Cancel order successful"
}
```

### 9.8 PUT /orders/:orderId/status

Cập nhật trạng thái đơn hàng
(Chỉ dành cho admin)

> Headers: Authorization (optional)

#### Params

| Param   | Type   | Description |
| ------- | ------ | ----------- |
| orderId | number | ID đơn hàng |

#### Body

```json
{
  "status": "string"
}
```

##### status hợp lệ

- `unconfirmed`
- `delivering`
- `delivered`
- `cancelled`

#### Response (200) – Success

```json
{
  "message": "Update order successful"
}
```

### 9.9 DELETE /orders/:orderId

Xóa đơn hàng  
(Chỉ dành cho admin)

> Headers: Authorization

#### Params

| Param   | Type   | Description |
| ------- | ------ | ----------- |
| orderId | number | ID đơn hàng |

#### Response (200) – Success

```json
{
  "message": "Delete order successful"
}
```

---

## 10. User APIs

### 10.1 GET /users

Lấy danh sách tất cả người dùng  
(Chỉ dành cho admin)

> Headers: Authorization

#### Response (200) – Success

```json
{
  "totalUser": "number",
  "users": [
    {
      "userId": "number",
      "userName": "string",
      "email": "string",
      "phone": "string",
      "registerDate": "string",
      "isActiveAccount": "number",
      "orderCount": "number"
    }
  ]
}
```

### 10.2 GET /users/:userId

Lấy thông tin chi tiết người dùng theo ID

> Headers: Authorization

#### Params

| Param  | Type   | Description   |
| ------ | ------ | ------------- |
| userId | number | ID người dùng |

#### Response (200) – Success

```json
{
  "userName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "role": "string"
}
```

### 10.3 POST /users

Tạo mới người dùng  
(Chỉ dành cho admin)

> Headers: Authorization  
> Content-Type: application/json

#### Body

```json
{
  "userName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "address": "string"
}
```

#### Response (200)

```json
{
  "message": "Create user successful",
  "userId": "number"
}
```

### 10.4 PUT /users/updateMyInfo

Cập nhật thông tin cá nhân của người dùng hiện tại  
(Yêu cầu đăng nhập)

> Headers: Authorization  
> Content-Type: application/json

#### Body

```json
{
  "userName": "string",
  "email": "string",
  "phone": "string",
  "address": "string"
}
```

#### Response (200)

```json
{
  "message": "Update user successful"
}
```

### 10.5 PUT /users/:userId

Cập nhật trạng thái tài khoản người dùng  
(Chỉ dành cho admin)

> Headers: Authorization  
> Content-Type: application/json

#### Params

| Param  | Type   | Description   |
| ------ | ------ | ------------- |
| userId | number | ID người dùng |

#### Body

```json
{
  "isActive": "number"
}
```

> Ghi chú:
> -"isActive: 1 (kích hoạt) | 0 (vô hiệu hóa)"

#### Response (200)

```json
{
  "message": "Update isActive user successful"
}
```

### 10.6 DELETE /users/:userId

Xóa người dùng  
(Chỉ dành cho admin)

> Headers: Authorization

#### Params

| Param  | Type   | Description   |
| ------ | ------ | ------------- |
| userId | number | ID người dùng |

#### Response (200) – Success

```json
{
  "message": "Delete user successful"
}
```

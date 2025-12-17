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

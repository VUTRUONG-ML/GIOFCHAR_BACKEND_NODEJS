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
| Key | Value |
|----|------|
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



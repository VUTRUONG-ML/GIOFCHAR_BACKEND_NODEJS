# Manual Test: Logging and Observability

Tài liệu này kiểm tra thủ công các contract logging và observability hiện có.
Chỉ chạy các trường hợp gây gián đoạn dependency trên môi trường local.

## Quy ước

- Base URL mặc định: `http://localhost:8081`.
- Không ghi access token, guest token hoặc secret thật vào tài liệu hay Git.
- Với development, kiểm tra log trong terminal và `logs/combined.log`.
- Với production Docker, kiểm tra bằng `docker logs backend-giofchar-server`.

Chuẩn bị biến dùng chung:

```bash
export API_BASE_URL="http://localhost:8081"
export TEST_REQUEST_ID="550e8400-e29b-41d4-a716-446655440000"
```

## LOG-001: Tạo request ID khi client không gửi

### Mục tiêu

Xác nhận backend tạo UUID v4, gắn vào response và dùng trong log.

### Thực hiện

```bash
curl -i "$API_BASE_URL/health"
```

### Kết quả mong đợi

- HTTP status là `200`.
- Response có header `X-Request-ID` là UUID v4.
- Có `http_request` với status `started` và `completed`.
- Hai log có cùng `requestId` với response header.

## LOG-002: Giữ request ID hợp lệ từ client

### Thực hiện

```bash
curl -i \
  -H "X-Request-ID: $TEST_REQUEST_ID" \
  "$API_BASE_URL/health"
```

### Kết quả mong đợi

- Response trả lại đúng `X-Request-ID` đã gửi.
- Log started và completed có `requestId` bằng `$TEST_REQUEST_ID`.

## LOG-003: Thay request ID không hợp lệ

### Thực hiện

```bash
curl -i \
  -H "X-Request-ID: invalid-request-id" \
  "$API_BASE_URL/health"
```

### Kết quả mong đợi

- Backend không trả lại `invalid-request-id`.
- Response có một UUID v4 mới.
- Internal log dùng cùng UUID mới.

## CHECKOUT-001: Theo dõi toàn bộ guest checkout

### Chuẩn bị

Khởi tạo guest token:

```bash
curl -s -X POST "$API_BASE_URL/api/guest/init"
export GUEST_TOKEN="<guest-token-from-response>"
```

Lấy danh sách food:

```bash
curl -i \
  -H "X-Guest-Token: $GUEST_TOKEN" \
  "$API_BASE_URL/api/foods"
```

Chọn một `foodId` còn active và có variant phù hợp, rồi gọi detail endpoint:

```bash
curl -i \
  -H "X-Guest-Token: $GUEST_TOKEN" \
  "$API_BASE_URL/api/foods/<foodId>"
```

Trong response detail, tìm mảng `variants` và lấy `variantId` của variant muốn
dùng cho checkout. Gán giá trị đó vào biến:

```bash
export VARIANT_ID="<variantId-from-food-detail>"
```

Thêm sản phẩm vào cart và lấy `cartVersion` trong response:

```bash
curl -i \
  -X POST \
  -H "X-Guest-Token: $GUEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"variantId\":$VARIANT_ID,\"quantity\":1}" \
  "$API_BASE_URL/api/carts/cartItem"
```

```bash
export CART_VERSION="<cart-version-from-response>"
```

### Thực hiện

```bash
curl -i \
  -X POST \
  -H "X-Guest-Token: $GUEST_TOKEN" \
  -H "X-Request-ID: $TEST_REQUEST_ID" \
  -H "Content-Type: application/json" \
  -d "{\"cartVersion\":$CART_VERSION,\"customerName\":\"Manual Test\",\"email\":\"manual@example.com\",\"phone\":\"0900000000\",\"address\":\"Local test\",\"paymentMethod\":\"COD\"}" \
  "$API_BASE_URL/api/orders/guest/cod"
```

### Kết quả mong đợi

- Response status là `200` và trả `orderId`, `orderCode`.
- Các log sau đều có cùng `$TEST_REQUEST_ID`:
  - `http_request/started`
  - `checkout/started`
  - `transaction/started` (development level `debug`)
  - `create_order/succeeded`
  - `create_order_items/created`
  - `transaction/committed` (development level `debug`)
  - `payment/created`
  - `checkout/completed`
  - `http_request/completed`
- Không có raw guest token trong log.

## ERROR-001: Response 500 không lộ chi tiết nội bộ

> Cảnh báo: test này dừng MySQL. Chỉ chạy local và phải bật lại MySQL sau test.

### Thực hiện

```bash
docker compose stop mysql
```

```bash
curl -i \
  -H "X-Request-ID: $TEST_REQUEST_ID" \
  "$API_BASE_URL/api/users/1"
```

Cleanup bắt buộc:

```bash
docker compose start mysql
```

### Kết quả mong đợi

Response status là `500` và body chỉ chứa thông tin công khai:

```json
{
  "message": "Server error",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Response không chứa SQL, stack trace, database host hoặc `err.message`.
Internal log có cùng request ID, error message, stack và context.

## VNPAY-001: IPN không log secure hash

### Thực hiện

```bash
curl -i \
  "$API_BASE_URL/api/payments/vnpay/ipn?vnp_TxnRef=MANUAL-TEST&vnp_Amount=100000&vnp_SecureHash=DO_NOT_LEAK_THIS_HASH"
```

Kiểm tra file log development:

```bash
rg -n "DO_NOT_LEAK_THIS_HASH" logs/
```

Nếu chạy production Docker:

```bash
docker logs backend-giofchar-server 2>&1 \
  | rg "DO_NOT_LEAK_THIS_HASH"
```

### Kết quả mong đợi

- Response trả `RspCode: "97"` do chữ ký không hợp lệ.
- Có log `verify_payment_callback` với status `failed`.
- Access log chỉ có path `/api/payments/vnpay/ipn`, không có query string.
- Hai lệnh tìm kiếm không trả về secure hash thử nghiệm.

## HTTP-001: Client đóng khi chưa gửi hết request

### Chuẩn bị

Cần có lệnh `nc` (netcat). Lệnh bên dưới khai báo body 1000 byte nhưng chỉ
gửi một phần rồi đóng connection.

### Thực hiện

```bash
printf 'POST /api/auth/login HTTP/1.1\r\nHost: localhost:8081\r\nContent-Type: application/json\r\nContent-Length: 1000\r\n\r\n{"email":"unfinished' \
  | nc localhost 8081
```

### Kết quả mong đợi

- Có đúng một `http_request` log với status `aborted`.
- Reason là `REQUEST_ABORTED_BY_CLIENT` hoặc
  `CONNECTION_CLOSED_BEFORE_RESPONSE_FINISHED` tùy event đến trước.
- Không có cả hai aborted log cho cùng một `requestId`.
- Không có `http_request/completed` cho cùng request nếu response chưa finish.

## LIFECYCLE-001: Graceful shutdown bằng SIGINT

### Thực hiện

```bash
npm run dev
```

Sau khi application startup thành công, nhấn `Ctrl+C`.

### Kết quả mong đợi

- Có `application_shutdown/started` với reason `SIGINT`.
- Có `application_shutdown/completed` với exit code `0`.
- HTTP server và MySQL pool được đóng.
- Không có `SHUTDOWN_TIMEOUT`.

## LIFECYCLE-002: Graceful shutdown bằng SIGTERM

### Thực hiện

Khởi động bằng production command:

```bash
npm start
```

Từ terminal khác, tìm PID và gửi signal:

```bash
pgrep -f "node ./src/index.js"
kill -TERM <pid>
```

### Kết quả mong đợi

- Có `application_shutdown/started` với reason `SIGTERM`.
- Có `application_shutdown/completed` với exit code `0`.
- Process kết thúc bình thường và không timeout.

## DOCKER-001: Rotation và retention của backend log

### Thực hiện

Recreate backend để áp dụng logging options:

```bash
docker compose up -d --force-recreate backend
```

Kiểm tra cấu hình:

```bash
docker inspect \
  --format='{{json .HostConfig.LogConfig}}' \
  backend-giofchar-server
```

### Kết quả mong đợi

Kết quả chứa:

```json
{
  "Type": "json-file",
  "Config": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Docker rotate khi một file đạt 10 MB và chỉ giữ tối đa 3 file cho backend.

## Những trường hợp để dành cho automated test

Các trường hợp sau khó tái hiện ổn định và an toàn bằng manual test:

- `conn.commit()` reject thì không có `checkout/completed`.
- Checkout lỗi thì `rollback()` được gọi đúng một lần.
- `rollback()` tự reject nhưng lỗi gốc vẫn được bảo toàn.
- Hai VNPay IPN đồng thời chỉ xử lý payment một lần.
- Redaction che object lồng nhau mà không làm thay đổi các tracing ID.

Các invariant này nên được kiểm tra bằng mock/stub khi thiết lập test runner.

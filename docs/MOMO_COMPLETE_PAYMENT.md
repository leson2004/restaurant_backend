# Tích hợp MOMO thanh toán hoàn thành đơn (Complete reservation)

**Mục đích:** Mô tả luồng backend đã implement khi khách chọn thanh toán MOMO để **hoàn tất đơn** (đơn đang ở trạng thái CHECKED_IN → COMPLETED). Dùng tài liệu này làm spec / prompt cho BE hoặc FE khi tích hợp.

---

## Tổng quan luồng

1. **Frontend** gọi API hoàn thành đơn với `payment_method: "momo"`.
2. **Backend** không cập nhật reservation ngay mà tạo đơn thanh toán MOMO và trả về **payUrl**.
3. **Frontend** redirect người dùng đến **payUrl** (app/web MOMO).
4. Khách thanh toán trên MOMO.
5. **MOMO** gọi **callback (IPN)** về server.
6. **Backend** xác thực callback, cập nhật reservation sang COMPLETED và ghi log.

---

## 1. API hoàn thành đơn (khi chọn MOMO)

**Endpoint:** `POST /api/reservations_t_admin/:id/complete`  
**Auth:** Cần token (authenticateToken).  
**Body (JSON):**

```json
{
  "payment_method": "momo",
  "voucher_code": "",
  "special_promotion_id": null,
  "point_used": 0,
  "amount_received": null
}
```

**Khi `payment_method === "momo"`:**

- Backend tính toán: subtotal, giảm giá (tier, khuyến mãi, điểm), thuế 5%, phí 3%, `final_amount`, `remaining_due` (số tiền còn phải thanh toán sau khi trừ cọc).
- Backend **không** cập nhật reservation (không set status = 3 ngay).
- Backend gọi MOMO API tạo đơn với số tiền = `remaining_due`, và trả về cho client.

**Response 200 (MOMO – cần redirect):**

```json
{
  "success": true,
  "payUrl": "https://test-payment.momo.vn/...",
  "orderId": "HS12345678-F-1738...",
  "requiresRedirect": true,
  "message": "Chuyển hướng đến MOMO để thanh toán",
  "payment_info": {
    "subtotal": 500000,
    "tier_discount": 0,
    "special_promotion_discount": 0,
    "points_discount": 0,
    "total_discount": 0,
    "tax": 25000,
    "service": 15000,
    "final_amount": 540000,
    "deposit": 100000,
    "remaining_due": 440000,
    "payment_method": "momo"
  }
}
```

**Frontend cần làm:**

- Nếu response có `requiresRedirect === true` và có `payUrl` → **redirect** (window.location.href hoặc link) người dùng đến `payUrl`.
- Không coi đơn đã COMPLETED cho đến khi có xác nhận từ server (ví dụ sau khi redirect về trang success và gọi lại GET detail để thấy status = 3).

---

## 2. Callback MOMO (IPN) – Backend xử lý

**URL callback (IPN):** `POST {LOCAL_URL}/api/public/payment/momo/complete/callback`  
Ví dụ: `http://localhost:8080/api/public/payment/momo/complete/callback`  
**Không cần auth** (MOMO server gọi).

**Body MOMO gửi đến (mẫu):**

- `resultCode`: 0 = thành công, khác 0 = thất bại/hủy/hết hạn.
- `orderId`, `amount`, `transId`, `extraData` (base64/JSON chứa `type: "complete"`, `reservationId`, `finalAmount`, `point_used`, `totalDiscount`, …).

**Backend đã làm:**

- Parse `extraData` lấy `reservationId`, `finalAmount`, `point_used`, `totalDiscount`.
- Nếu `resultCode === 0`: cập nhật reservation: `status = 3` (COMPLETED), `completed_at`, `paid_at`, `total_amount`, `payment_method = "momo"`, `momo_order_id`; trừ điểm membership nếu có `point_used`; tạo bản ghi `ReservationLog` (action COMPLETE).
- Trả về HTTP 200 + JSON để MOMO nhận.

**Lưu ý:** Frontend **không** gọi endpoint callback này; chỉ MOMO gọi. Frontend chỉ cần redirect user đến `payUrl` và (tùy chọn) có trang “complete-success” để user quay lại sau khi thanh toán.

---

## 3. Redirect URL sau khi thanh toán (return URL)

Backend đã cấu hình **redirectUrl** khi tạo đơn MOMO:

- Nếu có env `FRONTEND_URL`: `{FRONTEND_URL}/reservation/complete-success`
- Mặc định: `http://localhost:3001/reservation/complete-success`

Sau khi khách thanh toán xong trên MOMO, MOMO có thể redirect khách về URL này. Frontend nên có route tương ứng (ví dụ `/reservation/complete-success`) để hiển thị “Thanh toán thành công” và (tùy chọn) gọi `GET /api/reservations_t_admin/:id` hoặc detail để kiểm tra `status === 3`.

---

## 4. Biến môi trường Backend

| Biến | Ý nghĩa |
|------|---------|
| `MOMO_ACCESSKEY` | Access key MOMO |
| `MOMO_SECRETKEY` | Secret key MOMO |
| `LOCAL_URL` | URL gốc của server (để MOMO gọi IPN), ví dụ `http://localhost:8080` |
| `FRONTEND_URL` | (Tùy chọn) URL frontend, dùng làm redirectUrl sau thanh toán |

---

## 5. Prompt / mô tả ngắn cho BE (hoặc AI)

Có thể dùng đoạn sau làm prompt khi cần mô tả tích hợp:

```text
Backend đã tích hợp MOMO cho bước "hoàn thành đơn" (complete reservation):

- Khi gọi POST /api/reservations_t_admin/:id/complete với payment_method: "momo", backend không cập nhật reservation ngay mà tạo đơn MOMO (số tiền = remaining_due), trả về payUrl và requiresRedirect: true.
- Frontend phải redirect user đến payUrl. Khi khách thanh toán xong, MOMO gọi IPN tới POST /api/public/payment/momo/complete/callback.
- Backend xử lý callback: nếu resultCode === 0 thì cập nhật reservation (status=3, completed_at, paid_at, total_amount, payment_method=momo), trừ điểm nếu có, ghi ReservationLog. Cần env: MOMO_ACCESSKEY, MOMO_SECRETKEY, LOCAL_URL; tùy chọn FRONTEND_URL cho redirect sau thanh toán.
```

---

## 6. So sánh với thanh toán Cash

| Bước | Cash | MOMO |
|------|------|------|
| Gọi POST .../complete | Có | Có |
| Backend cập nhật reservation ngay | Có (status=3, paid_at, …) | Không |
| Response | data: reservation, payment_info | payUrl, requiresRedirect, payment_info |
| Frontend | Hiển thị “Thanh toán thành công” | Redirect đến payUrl |
| Cập nhật COMPLETED | Ngay trong request | Trong callback MOMO (IPN) |

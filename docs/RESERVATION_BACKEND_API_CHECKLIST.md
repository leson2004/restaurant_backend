# Báo cáo kiểm tra Backend – API Đặt bàn (Reservations)

**Mục đích:** Liệt kê API đã có, request/response thực tế để đối chiếu với Frontend Admin đặt bàn.

**Base path:** Tất cả route admin đặt bàn: **`/api/reservations_t_admin`** (có `authenticateToken`). Bàn trống: **`/api/tables`**.

---

## Nhóm 1 – Timeline đặt bàn

### GET timeline theo ngày (bàn × reservations trong ngày)

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path thực tế** | `GET /api/reservations_t_admin/timeline` |
| **Query** | `date` (YYYY-MM-DD, **bắt buộc**), `party_size` (tùy chọn), `page`, `limit` (**bắt buộc** – backend validate số nguyên dương). |
| **Response 200** | Trả thẳng object (không bọc `data`): `{ tables, totalCount, totalPages, currentPage }`. Mỗi bàn: `{ id, code, capacity, reservations: [...] }`. Mỗi reservation: `id`, `reservation_code`, `fullname`, `tel`, `party_size`, `start_time`, `end_time`, `deposit`, `status` (số). **Khớp** spec (tên key snake_case). |
| **Response lỗi** | 400: `{ message }`. 500: `{ message, error }`. |

**Khác biệt so với spec:** Spec mong `page`, `limit` tùy chọn; backend **bắt buộc** `page` và `limit` và phải là số nguyên dương, nếu thiếu/sai trả 400.

---

## Nhóm 2 – Lấy đơn đặt bàn (chi tiết 1 đơn)

### GET một đơn theo ID

Backend có **hai** endpoint:

1. **GET chi tiết đầy đủ (dùng cho HOLD – có subtotal, deposit_required, hold countdown)**  
   - **Path:** `GET /api/reservations_t_admin/detail/:id`  
   - **Response 200:** `{ message, data: reservation }`.  
   - `data` có: `id`, `reservation_code`, `user`, `table`, `promotion`, `fullname`, `tel`, `email`, `party_size`, `start_time`, `end_time`, `status`, `deposit`, `reservation_type`, `note`, `reservation_details`, **`subtotal`**, **`deposit_required`**, **`is_hold_expired`**, **`remaining_hold_seconds`**.  
   - Chưa có trong object trả về (có thể có trong model): `hold_expired_at`, `paid_at`, `payment_method`, `checked_in_at`. Có `table_id` gián tiếp qua `table.id`. `points` (điểm membership) không có trong response này.

2. **GET đơn theo ID (dạng list 1 phần tử – legacy)**  
   - **Path:** `GET /api/reservations_t_admin/:id`  
   - **Response 200:** `{ message, results: [ reservation ], totalCount: 1, totalPages: 1, currentPage: 1 }`.  
   - Reservation từ service: có Table (alias `tableName` từ `code`), Promotion; **không** có `reservation_details` trong include.  
   - Field: snake_case (id, reservation_code, status, fullname, tel, email, party_size, table_id, start_time, end_time, deposit, …). Có `table`, `promotion`. Chưa đủ so với spec: thiếu rõ `hold_expired_at`, `paid_at`, `payment_method`, `checked_in_at`, `promotion_id`/`promotion_code`, `points`.

**Kết luận:** Path “một đơn” spec nói `GET /api/reservations_t_admin/:id` → **đúng** với endpoint (2). Spec mong “có thể `results: [ reservation ]` hoặc `data: reservation`” → Backend: (1) dùng `data`, (2) dùng `results`. Để có đủ field cho màn HOLD (subtotal, deposit_required, hold countdown) cần gọi **`/detail/:id`**; để có đủ field như spec (hold_expired_at, paid_at, checked_in_at, promotion_id, points) có thể cần bổ sung ở backend hoặc đối chiếu thêm với FE.

### GET danh sách món của đơn (reservation details)

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path thực tế** | `GET /api/reservations_t_admin/reservation_details/:reservation_id` (param là **`reservation_id`**, không phải `id`). |
| **Response 200** | `{ message, results }` – `results` là mảng reservation_detail, mỗi phần tử có field từ DB + Product với `product_name`, `product_image` (alias từ `name`, `image`). Có `id`, `product_id`, `quantity`, `price`. **Khớp** dạng `results: [ { id, product_id, product_name?, quantity, price } ]`. |

**Khác biệt:** Spec gợi ý path `.../reservation_details/:id` → backend dùng **`reservation_id`** (tên param khác, ý nghĩa giống).

---

## Nhóm 3 – HOLD (status = 0)

### POST thanh toán cọc

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `POST /api/reservations_t_admin/:id/pay-deposit` |
| **Body** | **`{ method }`** (string). Giá trị hợp lệ: `"CASH" | "BANK" | "MOMO" | "ZALOPAY"` (viết hoa). **Không** nhận `deposit` (số) – backend tự tính 30% subtotal. Spec nói `payment_method` → backend dùng key **`method`**. |
| **Response 200** | `{ message, data: updatedReservation }`. |
| **Response lỗi** | 400/404: `{ message }`. 500: `{ message, error }`. |

### PATCH cập nhật đơn (ví dụ hủy HOLD bằng status)

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `PATCH /api/reservations_t_admin/:id` |
| **Body** | Bất kỳ field nào (ví dụ `{ status: 4 }`). Backend gọi `patchReservationStatus(id, updates)`. |
| **Response 200** | `{ message }` – **không** trả lại reservation. FE muốn refresh thì gọi lại GET detail/GET by id. |

### PATCH cập nhật danh sách món (order) – HOLD/CONFIRMED

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có**, nhưng **khác** spec. |
| **Path** | `PATCH /api/reservations_t_admin/reservation_ad/:id` |
| **Body** | Spec mong `{ reservation_details: [ { product_id, quantity, price }, ... ] }`. Backend thực tế nhận **`products`** (và các field khác): `fullname`, `tel`, `email`, `reservation_date`, `party_size`, `note`, `total_amount`, `status`, **`products`** (mảng). Validation bắt buộc: `fullname`, `tel`, `reservation_date`, `status`. Đây là API “cập nhật toàn bộ đơn” (thông tin + danh sách món), không phải chỉ PATCH list món. |
| **Response 200** | `{ message }` – không trả reservation. |

**Kết luận:** Không có endpoint chỉ “PATCH cả list món” với body `reservation_details`. Có PATCH từng món (xem dưới) và PATCH “cả đơn” qua `reservation_ad/:id` với `products`.

### DELETE xóa một món khỏi đơn

Backend có **hai** cách xóa món:

1. **Legacy (theo product_id)**  
   - **Path:** `DELETE /api/reservations_t_admin/:reservationId/:productId`  
   - Response 200: `{ message }`.

2. **HOLD – xóa theo detail id (reservation_detail)**  
   - **Path:** `DELETE /api/reservations_t_admin/:id/items/:detailId`  
   - **`detailId`** là id bản ghi `reservation_detail`, **không** phải `product_id`.  
   - Response 200: `{ message, data }`.

3. **CHECKED_IN / POS – xóa theo product_id**  
   - **Path:** `DELETE /api/reservations_t_admin/:id/remove-item?product_id=...`  
   - Query param: **`product_id`** (không dùng `item_id`).  

Spec/legacy FE gọi `DELETE :reservationId/:productId` → **khớp** với (1). Nếu FE gọi `remove-item?product_id=...` → **khớp** với (3). Cần rõ FE đang dùng flow HOLD hay CHECKED_IN để chọn path và param đúng.

---

## Nhóm 4 – CONFIRMED (status = 1)

### POST check-in

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `POST /api/reservations_t_admin/:id/check-in` |
| **Body** | Rỗng hoặc `{}`. |
| **Response 200** | `{ message, reservation }` (reservation đã chuyển status 2, có `checked_in_at`). |
| **Response lỗi** | 404/400/500: `{ message }` hoặc `{ message, error }`. |

### POST hủy đơn (có hoàn cọc)

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `POST /api/reservations_t_admin/:id/cancel` |
| **Body** | `{ refund_type }` (string). Backend `toUpperCase()`; giá trị hợp lệ: `"FULL" | "HALF" | "NONE"`. |
| **Response 200** | `{ message, refund_amount, reservation }`. |
| **Response lỗi** | 404/400/500: `{ message }` hoặc `{ message, error }`. |

### PUT đổi bàn

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `PUT /api/reservations_t_admin/:id/change-table` |
| **Body** | `{ table_id: number }`. |
| **Response 200** | `{ message, old_table_id, new_table_id, reservation }`. |
| **Response lỗi** | 404/400/500: `{ message }`. |

### GET bàn trống

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `GET /api/tables/available` (route trong `tables.route.js`, không nằm trong `reservations_t_admin`). |
| **Query** | Hai mode: (1) **Mới:** `start_time`, `end_time`, `party_size` (ISO string); (2) **Cũ:** `date`, `start`, `end`, `party_size`. Nếu có `start_time` + `end_time` + `party_size` thì dùng service admin (theo slot); không thì bắt buộc `date`, `start`, `end`, `party_size`. |
| **Response 200** | Mode mới: `{ results: [ { id, name, capacity, location, status } ] }` (name từ `table.code`). **Khớp** spec. |

---

## Nhóm 5 – CHECKED_IN (status = 2) – POS

### POST thêm món

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `POST /api/reservations_t_admin/:id/add-item` |
| **Body** | `{ items: [ { product_id, quantity, price }, ... ] }`. |
| **Response 200/201** | Trả thẳng object từ service: `{ success, data, message }`. `data` là reservation (include `details`). FE có thể dùng `data` để refresh danh sách món. |

### PUT sửa một món (số lượng / giá)

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `PUT /api/reservations_t_admin/:id/update-item` |
| **Body** | `{ product_id, quantity, price }`. |
| **Response 200** | `{ success, data, message }`. |

### DELETE xóa một món

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `DELETE /api/reservations_t_admin/:id/remove-item?product_id=...` |
| **Query** | **`product_id`** (không dùng `item_id`). |
| **Response 200** | `{ success, data, message }` (data là reservation). |

### GET preview bill

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `GET /api/reservations_t_admin/:id/preview-bill` |
| **Response 200** | Service trả `{ success: true, data: { reservation_id, subtotal, tier_discount, deposit, tax, service, previewRemaining, finalAmount, special_promotions: [ { id, name, discount, type } ], breakdown } }`. Controller `res.json(result)` nên response body có **hai tầng**: `success` + `data`. Các key trong `data` là **snake_case** (trừ `previewRemaining`, `finalAmount` camelCase). Spec mong `subtotal`, `tier_discount`, `deposit`, `tax`, `service`, `previewRemaining`, `finalAmount`, `special_promotions`, `breakdown` → **đủ**. FE cần đọc `response.data` (axios) rồi có thể đọc tiếp `response.data.data` để lấy các key trên. |

### POST hoàn thành đơn (thanh toán cuối)

| Mục | Kết quả |
|-----|--------|
| **Đã implement?** | **Có** |
| **Path** | `POST /api/reservations_t_admin/:id/complete` |
| **Body** | `voucher_code`, `special_promotion_id`, `point_used`, **`payment_method`** (bắt buộc), `amount_received`. Backend chấp nhận payment_method: `"cash" | "bank" | "momo" | "zalopay"` (lowercase). |
| **Response 200** | `{ success, data, message, payment_info }`. `data` là reservation đã hoàn thành; `payment_info` có `subtotal`, `tier_discount`, `special_promotion_discount`, `points_discount`, `total_discount`, `tax`, `service`, `final_amount`, `deposit`, `remaining_due`, `amount_received`, `change_amount`, `payment_method`. |
| **Validate amount_received** | **Có**: khi `payment_method === "cash"` thì kiểm tra `amount_received >= remainingDue`; không đủ trả 400 `INSUFFICIENT_CASH` với message "Amount received is less than amount due". |

---

## Nhóm 6 – Tổng hợp

### Danh sách route liên quan đặt bàn (method + path đầy đủ)

**Base `/api`.** Admin: `/api/reservations_t_admin` (có auth). Tables: `/api/tables` (có auth).

- `POST /api/reservations_t_admin/changedishes`
- `PATCH /api/reservations_t_admin/notChange`
- `POST /api/reservations_t_admin/addTable`
- `POST /api/reservations_t_admin/quick-create`
- `GET /api/reservations_t_admin/` (getAllReservations)
- `GET /api/reservations_t_admin/timeline`
- `GET /api/reservations_t_admin/myBooking/:user_id`
- `PATCH /api/reservations_t_admin/reservation_ad/:id` (update full reservation + products)
- `PATCH /api/reservations_t_admin/:id` (patch một phần, e.g. status)
- `DELETE /api/reservations_t_admin/:reservationId/:productId` (xóa món theo productId – legacy)
- `GET /api/reservations_t_admin/existing-reservations`
- `GET /api/reservations_t_admin/reservation_details/:reservation_id`
- `POST /api/reservations_t_admin/`
- `GET /api/reservations_t_admin/filter-by-date`
- `GET /api/reservations_t_admin/detail/:id` (chi tiết HOLD: subtotal, deposit_required, hold countdown)
- `POST /api/reservations_t_admin/:id/pay-deposit`
- `POST /api/reservations_t_admin/:id/check-in`
- `POST /api/reservations_t_admin/:id/cancel`
- `PUT /api/reservations_t_admin/:id/items/:detailId` (update 1 món khi HOLD)
- `DELETE /api/reservations_t_admin/:id/items/:detailId` (xóa 1 món khi HOLD)
- `POST /api/reservations_t_admin/:id/items` (thêm 1 món khi HOLD)
- `PUT /api/reservations_t_admin/:id/change-table`
- `POST /api/reservations_t_admin/:id/add-item`
- `PUT /api/reservations_t_admin/:id/update-item`
- `DELETE /api/reservations_t_admin/:id/remove-item`
- `GET /api/reservations_t_admin/:id/preview-bill`
- `POST /api/reservations_t_admin/:id/complete`
- `GET /api/reservations_t_admin/:id` (get by id – results array)

**Tables:**

- `GET /api/tables/available` (query: `start_time`, `end_time`, `party_size` hoặc `date`, `start`, `end`, `party_size`)

### Khác biệt so với spec / format response

- **Timeline:** Response không bọc trong `data`; `page`/`limit` bắt buộc.
- **GET một đơn:** Có hai endpoint: `/detail/:id` trả `data` (có subtotal, hold countdown); `/:id` trả `results: [ reservation ]`. Field đầy đủ (hold_expired_at, paid_at, checked_in_at, promotion_id, points) có thể chưa đủ ở một trong hai, cần FE/BE thống nhất.
- **Reservation details:** Path dùng param **`reservation_id`**.
- **Pay-deposit body:** Key là **`method`**, không phải `payment_method`; không gửi `deposit`.
- **PATCH đơn:** `PATCH /:id` chỉ trả `message`, không trả reservation.
- **Cập nhật list món:** Chỉ có qua `PATCH reservation_ad/:id` với **`products`**, không có body `reservation_details`.
- **Xóa món HOLD:** Path dùng **`/:id/items/:detailId`** (detailId là id reservation_detail), không phải productId. Legacy vẫn có `DELETE :reservationId/:productId`.
- **Preview bill:** Response có dạng `{ success, data: { ... } }`; FE cần đọc `response.data.data` nếu dùng axios; key chủ yếu snake_case.
- **Complete:** Trả thêm `payment_info`; payment_method nhận lowercase.

### Response khi lỗi (4xx / 5xx)

- Hầu hết trả **`{ message: "..." }`**.
- Một số 500 trả **`{ message, error: error.message }`**.
- Không dùng key `error` thay cho `message` trong phần lớn endpoint.

**→ Frontend nên đọc `error.response?.data?.message` trước, nếu không có thì fallback `error.response?.data?.error` hoặc `error.message`.**

---

## Cách dùng

1. Đối chiếu với FE: `APIs.js`, `Reservations_t_AdminActions.js`, `GetReservationDetailAction.js`.

3. Lập bảng “Khớp / Chưa khớp” và chỉnh FE hoặc BE cho thống nhất.

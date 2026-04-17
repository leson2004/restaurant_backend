# MASTER – Trang quản lý danh sách đặt bàn (Admin)

**Dành cho Frontend:** Tài liệu mô tả API backend đã cung cấp cho **trang quản lý danh sách đặt bàn**, backend đã làm gì và trả về gì để FE hiển thị đúng và thao tác đúng.

---

## 1. MỤC ĐÍCH NGHIỆP VỤ

Trang phải trả lời trong 3 giây:

**“BÀN NÀO – GIỜ NÀO – KHÁCH NÀO – CÓ VẤN ĐỀ GÌ?”**

- Admin xem danh sách đặt bàn có **lọc** (ngày, giờ, bàn, trạng thái, tên/SĐT).
- Admin có **quick view**: đơn sắp đến, đơn chưa cọc, đơn chưa check-in, đơn đang ăn.
- **Click 1 dòng** → đi sang trang chi tiết (FE dùng `id` để gọi GET detail hoặc điều hướng).
- **Không** chỉnh sửa sâu trên danh sách; chỉ xem và vào chi tiết.

---

## 2. API DANH SÁCH – Backend đã làm gì

### Endpoint

```
GET /api/reservations_t_admin/list
```

**Auth:** Cần gửi token (Bearer) – route dùng `authenticateToken`.

**Query params (tất cả optional):**

| Param         | Kiểu   | Mô tả                                                                                                                                                      |
| ------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `date`        | string | Ngày lọc (YYYY-MM-DD), theo **giờ Việt Nam** (đơn có start_time rơi vào ngày này).                                                                         |
| `time_from`   | string | Giờ bắt đầu (HH:mm), chỉ có hiệu lực khi có `date`. Lọc đơn có start_time >= date + time_from (giờ VN).                                                    |
| `time_to`     | string | Giờ kết thúc (HH:mm), chỉ có hiệu lực khi có `date`. Lọc đơn có start_time <= date + time_to (giờ VN).                                                     |
| `table_id`    | number | Lọc theo ID bàn.                                                                                                                                           |
| `status`      | string | Trạng thái: một số (vd `1`) hoặc nhiều số cách nhau dấu phẩy (vd `0,1,2`). Giá trị: 0=HOLD, 1=CONFIRMED, 2=CHECKED_IN, 3=COMPLETED, 4=CANCELED, 5=EXPIRED. |
| `quick_view`  | string | Một trong: `upcoming` \| `no_deposit` \| `not_checked_in` \| `eating` (xem bảng Quick view bên dưới).                                                      |
| `searchName`  | string | Tìm theo tên khách (LIKE, không phân biệt hoa thường).                                                                                                     |
| `searchPhone` | string | Tìm theo SĐT (LIKE).                                                                                                                                       |
| `page`        | number | Trang (mặc định 1).                                                                                                                                        |
| `limit`       | number | Số dòng/trang (mặc định 20, tối đa 100).                                                                                                                   |

**Quick view – Backend áp dụng:**

| Giá trị          | Ý nghĩa                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `upcoming`       | Đơn **sắp đến**: status = CONFIRMED (1) và start_time > now.         |
| `no_deposit`     | **Chưa cọc**: status = HOLD (0) hoặc (CONFIRMED (1) và deposit = 0). |
| `not_checked_in` | **Chưa check-in**: status = CONFIRMED (1).                           |
| `eating`         | **Đang ăn**: status = CHECKED_IN (2).                                |

**Thứ tự trả về:** Sắp xếp theo `start_time` tăng dần (đơn gần nhất trước), rồi `id` tăng dần.

---

## 3. Response – Backend trả về gì

**Status 200 – Thành công**

```json
{
  "message": "Danh sách đặt bàn",
  "totalCount": 42,
  "results": [
    {
      "id": 28,
      "reservation_code": "HS49720801",
      "start_time": "2026-03-07T02:27:00.000Z",
      "end_time": "2026-03-07T04:57:00.000Z",
      "table_id": 8,
      "table_code": "Bàn 3",
      "fullname": "Lê Văn",
      "tel": "0934874873",
      "email": null,
      "party_size": 3,
      "status": 1,
      "deposit": 0,
      "payment_method": null,
      "total_amount": 0,
      "reservation_type": 1
    }
  ],
  "totalPages": 3,
  "currentPage": 1,
  "limit": 20
}
```

**Ý nghĩa từng field trong mỗi phần tử `results`:**

| Field              | Kiểu           | Mục đích (gợi ý cột / hành vi)                                                                 |
| ------------------ | -------------- | ---------------------------------------------------------------------------------------------- |
| `id`               | number         | ID đơn – dùng để **click vào chi tiết** (GET detail hoặc navigate `//reservation/detail/:id`). |
| `reservation_code` | string         | Mã đặt bàn (hiển thị).                                                                         |
| `start_time`       | string         | Giờ bắt đầu (ISO UTC) – cột **Thời gian** (FE format theo giờ VN).                             |
| `end_time`         | string         | Giờ kết thúc (ISO UTC) – có thể hiển thị “start – end”.                                        |
| `table_id`         | number         | ID bàn.                                                                                        |
| `table_code`       | string         | Tên/code bàn – cột **Bàn**.                                                                    |
| `fullname`         | string         | Tên khách – cột **Khách**.                                                                     |
| `tel`              | string         | SĐT – cột **Khách** hoặc riêng.                                                                |
| `email`            | string \| null | Email (nếu có).                                                                                |
| `party_size`       | number         | Số người – cột **Số người**.                                                                   |
| `status`           | number         | Trạng thái – cột **Trạng thái** (map số → chữ, xem bảng dưới).                                 |
| `deposit`          | number         | Tiền cọc đã thu.                                                                               |
| `payment_method`   | string \| null | Phương thức thanh toán (cash, momo, …) – cột **Thanh toán** / rủi ro.                          |
| `total_amount`     | number         | Tổng tiền (đã tính).                                                                           |
| `reservation_type` | number         | 0=ONLINE, 1=WALK_IN (tùy FE có hiển thị).                                                      |

**Map `status` sang hiển thị:**

| status | Ý nghĩa    | Gợi ý hiển thị |
| ------ | ---------- | -------------- |
| 0      | HOLD       | Chờ cọc        |
| 1      | CONFIRMED  | Đã xác nhận    |
| 2      | CHECKED_IN | Đang ăn        |
| 3      | COMPLETED  | Hoàn thành     |
| 4      | CANCELED   | Đã hủy         |
| 5      | EXPIRED    | Hết hạn        |

**Lỗi:**

- **400:** Query không hợp lệ (vd page/limit sai).
- **500:** `{ message, error }` – lỗi server.

---

## 4. Giao diện danh sách (chuẩn thực tế) – FE nên có

Cột gợi ý từ tài liệu nghiệp vụ và từ response:

| Cột            | Nguồn từ API                                | Mục đích               |
| -------------- | ------------------------------------------- | ---------------------- |
| **Thời gian**  | `start_time`, `end_time`                    | Ưu tiên xử lý          |
| **Bàn**        | `table_code`                                | Điều phối              |
| **Khách**      | `fullname`, `tel`                           | Nhận diện              |
| **Số người**   | `party_size`                                | Kiểm tra               |
| **Trạng thái** | `status` (map 0–5)                          | Quyết định             |
| **Thanh toán** | `payment_method`, `deposit`, `total_amount` | Rủi ro                 |
| **Hành động**  | Dùng `id`                                   | Click → trang chi tiết |

- **Hành động:** Nút/link “Chi tiết” → điều hướng đến trang chi tiết đơn (vd `/reservation/detail/:id` hoặc gọi `GET /reservation/detail/:id` rồi hiển thị).

---

## 5. Thao tác Admin (tóm tắt)

- **Tìm kiếm:** Gửi đúng query `date`, `time_from`, `time_to`, `table_id`, `status`, `searchName`, `searchPhone` lên `GET .../list`.
- **Quick view:** Gửi `quick_view=upcoming` | `no_deposit` | `not_checked_in` | `eating`.
- **Quan sát nhanh:** Dùng kết hợp bộ lọc + quick view; danh sách đã sắp theo giờ (gần nhất trước).
- **Vào chi tiết:** Click dòng → dùng `id` để mở trang chi tiết (không chỉnh sửa sâu trên bảng).

---

## 6. Prompt ngắn cho FE (copy dán)

```
Backend đã có API danh sách đặt bàn cho trang quản lý admin:

- GET /api/reservations_t_admin/list (có auth).
- Query: date (YYYY-MM-DD), time_from, time_to (HH:mm), table_id, status (số hoặc "0,1,2"), quick_view (upcoming | no_deposit | not_checked_in | eating), searchName, searchPhone, page, limit (mặc định 20, tối đa 100).
- Response: message, totalCount, results[], totalPages, currentPage, limit. Mỗi phần tử results có: id, reservation_code, start_time, end_time, table_id, table_code, fullname, tel, email, party_size, status (0–5), deposit, payment_method, total_amount, reservation_type. Sắp xếp theo start_time ASC.
- FE: hiển thị bảng (Thời gian, Bàn, Khách, Số người, Trạng thái, Thanh toán, Hành động); click id → trang chi tiết (GET /reservation/detail/:id hoặc route FE tương ứng).
```

---

**Base URL API:** `http://localhost:8080` (hoặc theo env). Tất cả route admin đặt bàn: prefix `/api/reservations_t_admin`.

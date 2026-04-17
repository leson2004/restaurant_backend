# Comment Blog API – Hướng dẫn cho Frontend

Tài liệu mô tả response và cách FE nên xử lý khi gọi API bình luận blog (có kiểm duyệt nội dung bằng AI).

---

## Base URL & Auth

- **Prefix:** `/api/comment-blog` (có auth) hoặc `/api/public/comment-blog` (không auth, tùy project).
- **Rate limit:** Tạo/sửa bình luận: tối đa **15 request/phút/IP**. Vượt quá → `429` (xem bên dưới).

---

## 1. Lấy danh sách bình luận

### GET `/` (danh sách toàn hệ thống)

**Query:**

| Param | Kiểu | Mô tả |
|--------|------|--------|
| `searchName` | string | Tìm trong nội dung (optional) |
| `page` | number | Trang (default 1) |
| `limit` | number | Số item/trang (default 10) |
| `include_all_statuses` | `"1"` \| `"true"` | **Admin:** lấy cả hidden/rejected (optional) |

**Response 200:**

```json
{
  "message": "Fetch comments successfully",
  "results": [
    {
      "id": 1,
      "blog_id": 1,
      "user_id": 1,
      "content": "Nội dung bình luận",
      "toxicity_score": 0.1,
      "moderation_status": "approved",
      "moderation_reason": null,
      "is_deleted": 0,
      "created_at": "...",
      "updated_at": "...",
      "user": { "fullname": "...", "avatar": "..." }
    }
  ],
  "totalCount": 100,
  "totalPages": 10,
  "currentPage": 1,
  "limit": 10
}
```

- Mặc định **chỉ có** bình luận `moderation_status === "approved"` và chưa xóa.
- Admin: gửi `include_all_statuses=1` (hoặc `true`) để thấy cả `hidden`/`rejected` (nên chỉ gửi khi user đã đăng nhập admin).

---

### GET `/blog/:blog_id` (theo bài viết)

**Query:** Giống trên (`page`, `limit`, `include_all_statuses`).

**Response 200:** Cùng cấu trúc như GET `/` (chỉ lọc theo `blog_id`).

---

## 2. Tạo bình luận – POST `/`

**Body:** `{ "blog_id", "user_id", "content" }`

Backend chạy kiểm duyệt AI trước khi lưu. FE cần xử lý theo **status** và **HTTP status**:

| HTTP | `status` trong body | Ý nghĩa | FE nên làm |
|------|----------------------|--------|-------------|
| **201** | `approved` | Bình luận hợp lệ, đã hiển thị | Hiển thị thông báo thành công, thêm comment vào list (dùng object trong `comment`) |
| **201** | `hidden` | Nội dung vi phạm nhẹ, bị ẩn | Hiển thị message: "Bình luận đã bị ẩn do vi phạm tiêu chuẩn cộng đồng"; có thể không thêm vào list hoặc thêm với trạng thái "đã ẩn" |
| **400** | `rejected` | Nội dung không phù hợp, không lưu | Hiển thị lỗi: dùng `message` hoặc `reason`; không thêm comment |
| **429** | - | Rate limit (quá 15 lần/phút) | Hiển thị "Quá nhiều thao tác. Thử lại sau X giây." (dùng `retryAfter` nếu có) |
| **500** | - | Lỗi server | Hiển thị `error` chung |

**Ví dụ response thành công (approved):**

```json
{
  "status": "approved",
  "message": "Thêm bình luận thành công",
  "comment": { "id": 2, "blog_id": 1, "user_id": 1, "content": "...", "moderation_status": "approved", ... }
}
```

**Có thể có thêm field:** `moderation_skipped: true` khi backend không gọi được AI (lỗi/timeout) và **fail-open** (vẫn cho đăng). FE có thể bỏ qua hoặc hiển thị gợi ý nhẹ kiểu "Bình luận đã được đăng (kiểm duyệt tạm thời không khả dụng)."

**Ví dụ rejected (400):**

```json
{
  "status": "rejected",
  "message": "Bình luận chứa nội dung không phù hợp",
  "reason": "Giải thích ngắn từ AI"
}
```

**Ví dụ rate limit (429):**

```json
{
  "error": "Quá nhiều thao tác. Vui lòng thử lại sau 1 phút.",
  "retryAfter": 45
}
```

`retryAfter`: số giây nên chờ trước khi gửi lại.

---

## 3. Cập nhật bình luận – PUT `/` hoặc PUT `/:id`

**Body (khi PUT `/`):** `id`, `customer_id` hoặc `user_id`, `content`.  
**Body (khi PUT `/:id`):** `customer_id` hoặc `user_id`, `content` (id lấy từ URL).

Backend **luôn chạy lại kiểm duyệt** khi nội dung thay đổi.

| HTTP | `status` trong body | Ý nghĩa | FE nên làm |
|------|----------------------|--------|-------------|
| **200** | `approved` | Nội dung ổn | Cập nhật UI, thông báo thành công |
| **200** | `hidden` | Nội dung vi phạm nhẹ, bị ẩn | Thông báo "Đã cập nhật nhưng bình luận bị ẩn do vi phạm tiêu chuẩn"; cập nhật trạng thái comment (ẩn) |
| **400** | `rejected` | Nội dung chỉnh sửa không phù hợp | Hiển thị `message`/`reason`, không lưu thay đổi vào UI |
| **429** | - | Rate limit | Giống POST |
| **500** | - | Lỗi server | Hiển thị `error` |

Có thể có `moderation_skipped: true` (ý nghĩa giống POST).

---

## 4. Cập nhật một phần – PATCH `/` hoặc PATCH `/:id`

**Body:** bất kỳ field nào cần sửa (ví dụ `content`, `id` nếu dùng PATCH `/`).  
Khi gửi **content** trong body, backend cũng chạy lại kiểm duyệt. Nếu **rejected** → 400 (giống PUT); nếu **approved** hoặc **hidden** → 200 và cập nhật kèm `toxicity_score`, `moderation_status`, `moderation_reason`.

---

## 5. Xóa bình luận – DELETE `/:id`

**Response 200:** `{ "message": "Xóa bình luận thành công" }`  
FE: xóa comment khỏi list (soft delete phía BE).

---

## 6. Các trạng thái kiểm duyệt (moderation_status)

| Giá trị | Ý nghĩa |
|--------|--------|
| `approved` | Hiển thị công khai |
| `hidden` | Đã lưu nhưng không hiển thị trong list công khai |
| `rejected` | Không lưu (chỉ dùng trong response khi tạo/cập nhật thất bại) |

---

## 7. Tóm tắt cho FE

1. **Tạo bình luận:** Đọc `status` (approved / hidden / rejected) và HTTP code để quyết định thông báo và có thêm comment vào list hay không.
2. **Sửa bình luận (PUT):** Đọc `status` tương tự; rejected thì không áp dụng thay đổi lên UI.
3. **Rate limit:** Gặp 429 thì hiển thị thông báo và dùng `retryAfter` (giây) nếu có.
4. **Admin:** Dùng `include_all_statuses=1` khi gọi GET list để xem cả bình luận hidden/rejected (chỉ cho user admin).
5. **moderation_skipped:** Tùy chọn hiển thị gợi ý khi kiểm duyệt tạm thời không chạy (fail-open).

Nếu bạn muốn thêm ví dụ request/response cho từng endpoint (GET/POST/PUT/PATCH/DELETE) hoặc thêm luôn vào OpenAPI/Swagger, có thể mở rộng doc này tương ứng.

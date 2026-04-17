# Hybrid AI Chatbot – Hướng dẫn tích hợp Frontend

Backend đã nâng cấp chatbot tư vấn từ **dữ liệu cứng** sang **Hybrid AI Chatbot**: trả lời dựa trên **dữ liệu thật từ CSDL** nhà hàng (menu, khuyến mãi, bàn, đặt bàn, liên hệ, **đơn đặt bàn của khách**) và **chỉ lấy đúng dữ liệu cần thiết** theo từng câu hỏi (phân loại ý định – intent).

---

## 1. Backend đã làm gì?

- **Intent classification:** Mỗi tin nhắn của khách được phân loại thành một trong: `menu` | `promotion` | `reservation` | `table` | `contact` | `greeting` | **`my_order`** | `other`.
- **Query chọn lọc:** Chỉ query CSDL theo intent (ví dụ: hỏi món → chỉ lấy products + categories; hỏi khuyến mãi → chỉ lấy promotions đang hiệu lực; hỏi **đơn của tôi** → chỉ lấy reservations của `user_id` = `senderId`; hỏi địa chỉ → chỉ dùng config tĩnh).
- **Trả lời bằng Gemini:** Context (thực đơn / khuyến mãi / bàn / liên hệ / hướng dẫn đặt bàn / **đơn đặt bàn của khách**) được đưa vào prompt; AI trả lời ngắn gọn, đúng trọng tâm, **chỉ dựa trên dữ liệu được cung cấp** (không bịa).
- **Cấu hình nhà hàng:** Thông tin tĩnh (tên, địa chỉ, giờ mở cửa, SĐT, email, Facebook, Zalo, quy trình đặt bàn) lấy từ `src/config/restaurant.config.js`, có thể ghi đè bằng biến môi trường (ví dụ `RESTAURANT_NAME`, `RESTAURANT_ADDRESS`, `MENU_LINK_URL`, `ASSETS_BASE_URL`, …).
- **Trả lời kèm ảnh + link (khi hỏi về món ăn):** Khi khách hỏi về thực đơn/món ăn (intent `menu`), bot trả lời **text** + **1–2 ảnh món** (URL từ CSDL) + **link** tới trang thực đơn để chọn món và đặt bàn. Ảnh và link được lưu vào DB (`attachments`) để xem lại lịch sử chat.

**Kết quả:** Chatbot trả lời được câu hỏi xoay quanh nhà hàng (món ăn, giá, món gợi ý theo mùa/giảm cân/cảm/gia đình, khuyến mãi, đặt bàn, bàn, địa chỉ, giờ, liên hệ) **và khi khách hỏi về đơn đã đặt** (đơn của tôi, trạng thái đơn, đơn hàng của tôi) thì bot trả lời dựa trên đơn đặt bàn của chính user đó (nếu frontend gửi đúng `senderId`). Khi hỏi về món ăn, reply có thêm ảnh và link "Xem thực đơn & đặt bàn".

---

## 2. Giao diện với Frontend (Socket)

### 2.1. Gửi tin nhắn (kích hoạt bot khi cần)

- **Event gửi:** `send-message`
- **Payload (khuyến nghị):**

```json
{
  "tempId": "client-generated-id",
  "roomId": 123,
  "senderRole": "customer",
  "senderId": 1,
  "message": "Đơn đặt bàn của tôi thế nào rồi?",
  "toBot": true
}
```

| Trường       | Bắt buộc | Mô tả |
|--------------|----------|--------|
| `roomId`     | Có       | ID phòng chat. |
| `senderRole` | Có       | Vai trò người gửi: `"customer"` \| `"admin"`. |
| `message`    | Có       | Nội dung tin nhắn. |
| `toBot`      | Không    | `true` = gửi cho bot, backend sẽ trả lời bằng AI. |
| **`senderId`** | **Nên gửi khi là customer** | **ID user (khách) đang đăng nhập.** Backend dùng làm `customerId` để khi khách hỏi về **đơn đặt bàn của tôi** thì bot lấy đúng đơn theo `user_id`. Nếu không gửi, bot vẫn chạy nhưng câu hỏi về đơn của tôi sẽ trả lời kiểu "Chưa đăng nhập" / "Chưa có đơn". |
| `tempId`     | Tùy chọn | ID tạm phía client (để đồng bộ UI). |

- **Khi nào bot trả lời:** Backend chỉ gọi AI khi `senderRole === "customer"` **và** `toBot === true`. Nếu `toBot === false` hoặc không gửi, tin nhắn vẫn được lưu và hiển thị nhưng **không** có reply từ bot.

### 2.2. Nhận tin nhắn (bao gồm reply của bot)

- **Event nhận:** `receive-message`
- **Payload:** Mọi tin nhắn đều có `id`, `roomId`, `senderRole`, `senderId`, `message`, `created_at`. Tin nhắn **bot** có thể có thêm **`attachments`** (chỉ khi bot trả lời về món ăn/thực đơn).

**Ví dụ 1 – Tin nhắn bot chỉ text (đơn hàng, khuyến mãi, liên hệ, …):**

```json
{
  "id": 456,
  "roomId": 123,
  "senderRole": "bot",
  "senderId": null,
  "message": "Bạn có 2 đơn đặt bàn. Đơn mã RV001: ngày 06/03/2025, 18:00, 4 khách, trạng thái Đã xác nhận...",
  "created_at": "2025-03-05T10:00:00.000Z"
}
```

**Ví dụ 2 – Tin nhắn bot về món ăn (có ảnh + link, lưu trong DB để xem lịch sử):**

```json
{
  "id": 457,
  "roomId": 123,
  "senderRole": "bot",
  "senderId": null,
  "message": "Nhà hàng có nhiều món phù hợp mùa hè:\n\n• Canh chua, gỏi cuốn, bún...\n\nBạn có thể xem full thực đơn và đặt bàn tại link bên dưới.",
  "attachments": {
    "images": [
      "http://localhost:3000/uploads/products/pho-bo.jpg",
      "http://localhost:3000/uploads/products/bun-cha.jpg"
    ],
    "link": {
      "url": "http://localhost:3001/menu",
      "label": "Xem thực đơn & đặt bàn"
    }
  },
  "created_at": "2025-03-05T10:01:00.000Z"
}
```

- **`attachments`** (chỉ có ở tin nhắn bot, có thể `null`/không gửi):
  - **`images`**: mảng URL ảnh (1–2 ảnh món). FE dùng để hiển thị `<img src="...">` hoặc gallery.
  - **`link`**: object `{ url, label }` — link sang trang thực đơn; FE hiển thị nút/links (ví dụ "Xem thực đơn & đặt bàn") và chuyển hướng tới `url`.
- Tin nhắn user và tin nhắn bot đều đến qua cùng một event `receive-message`; phân biệt bằng `senderRole`: `"customer"` | `"admin"` | `"bot"`. Tin nhắn bot có `senderId === null`.

### 2.3. Lỗi

- **Event:** `error-message`
- **Payload:** `{ "message": "Không gửi được tin nhắn" }` (hoặc thông báo lỗi khác từ server).

---

## 3. Lịch sử chat (API) – ảnh + link đã lưu trong DB

Khi gọi API lấy tin nhắn theo room hoặc theo user (ví dụ `GET .../messages/by-room/:roomId` hoặc theo user), mỗi phần tử trong danh sách tin nhắn có dạng:

- **`message`** (string): nội dung text.
- **`attachments`** (object hoặc `null`): chỉ có ở tin nhắn bot đã lưu kèm ảnh + link (ví dụ reply về món ăn). Cấu trúc giống Socket:
  - `attachments.images`: mảng URL ảnh (1–2 phần tử).
  - `attachments.link`: `{ url, label }`.

FE khi render **lịch sử chat** cần kiểm tra `attachments`: nếu có thì hiển thị text + ảnh (từ `attachments.images`) + nút/link (từ `attachments.link`) giống như tin nhắn realtime.

---

## 4. Frontend cần làm gì?

- **Gửi đúng `senderId` khi khách đã đăng nhập:** Khi `senderRole === "customer"` và khách đang đăng nhập, luôn gửi `senderId` = ID user hiện tại (ví dụ `currentUser.id`). Như vậy khi khách hỏi "đơn của tôi", "đơn đã đặt", "trạng thái đơn" thì bot mới trả lời đúng đơn của khách đó.
- **Hiển thị tin nhắn bot:**
  - Luôn hiển thị `message` (text).
  - Nếu có `attachments`: hiển thị thêm `attachments.images` (1–2 ảnh, ví dụ `<img>` hoặc gallery) và `attachments.link` (nút/link với `label`, khi click chuyển hướng tới `url`, ví dụ `http://localhost:3001/menu`).
- **Lịch sử chat:** Khi load tin nhắn từ API, với mỗi message có `attachments` thì render giống tin nhắn realtime (text + ảnh + link) để xem lại đầy đủ.
- **Trải nghiệm:** Có thể hiển thị "Đang suy nghĩ…" sau khi user gửi tin nhắn với `toBot: true` cho đến khi nhận được `receive-message` từ bot (backend có thể mất vài giây để phân loại intent, query DB và gọi Gemini).

---

## 5. Tóm tắt

| Nội dung | Chi tiết |
|----------|----------|
| Event gửi tin nhắn | `send-message` |
| Event nhận tin nhắn | `receive-message` |
| Kích hoạt bot | `toBot: true` khi `senderRole === "customer"` |
| **ID khách cho bot** | **Gửi `senderId` (ID user) khi customer hỏi bot để bot trả lời được câu hỏi về đơn đặt bàn của tôi** |
| Phân biệt tin nhắn bot | `senderRole === "bot"`, `senderId === null` |
| Dữ liệu trả lời | Từ CSDL: menu, khuyến mãi, bàn, đặt bàn, liên hệ, **đơn đặt bàn của khách** (theo `user_id` = `senderId`) + config nhà hàng |
| **Reply về món ăn** | Bot gửi `message` + **`attachments`**: `images` (1–2 URL ảnh món) + `link` (`url`, `label`) để FE hiển thị ảnh và nút "Xem thực đơn & đặt bàn" |
| **Lịch sử chat** | Ảnh + link được lưu trong DB (`attachments`); API trả về cùng cấu trúc để FE hiển thị lại khi xem lịch sử |

Backend đã sẵn sàng Hybrid AI Chatbot; frontend cần gửi đúng `toBot: true` khi khách hỏi bot, **luôn gửi `senderId` khi khách đã đăng nhập**, và **hiển thị `attachments` (ảnh + link)** khi có để tin nhắn về món ăn đẹp và có CTA sang trang thực đơn.

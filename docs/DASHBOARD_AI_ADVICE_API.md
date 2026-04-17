# API Tư vấn thống kê từ AI (Dashboard)

**Dành cho Frontend:** Backend làm gì, trả về gì khi user bấm nút **"Tư vấn thống kê từ AI"**. Dùng tài liệu này để tích hợp FE.

---

## 1. Endpoint

```
GET /api/statistical/dashboard/ai-advice
```

- **Auth:** Giống dashboard: gửi **Bearer token** (cùng `authenticateToken`).
- **Query params:** Không có.
- **Khi nào gọi:** Chỉ khi user **bấm nút** "Tư vấn thống kê từ AI" trên trang Dashboard. **Không** gọi khi load trang dashboard.

---

## 2. Backend đã làm gì

1. Gọi nội bộ cùng bộ dữ liệu thống kê như `GET /api/statistical/dashboard` (executiveSummary, revenueAnalytics, menuAnalytics, reservationAnalytics, customerAnalytics, paymentAnalytics).
2. Tính thêm chỉ số hỗ trợ AI (trung bình doanh thu 7 ngày, độ lệch % so với trung bình).
3. Gửi toàn bộ context này cho **Gemini AI** một lần với prompt có cấu trúc.
4. AI trả về một JSON gồm 4 phần: **insights**, **recommendations**, **forecast**, **anomalies**.
5. Backend parse JSON và trả về cho FE. Nếu **Gemini lỗi** hoặc không có `GEMINI_API_KEY`: trả về `data: null` (vẫn 200), không làm fail request.

---

## 3. Response – Backend trả về gì

**Status 200**

### 3.1. Khi AI chạy thành công

```json
{
  "message": "AI advice fetched",
  "data": {
    "insights": "Doanh thu hôm nay tăng 12% so với hôm qua. Phở Bò bán chạy nhất. Giờ cao điểm 12h-14h.",
    "recommendations": [
      "Nên chuẩn bị thêm Phở Bò cho ngày mai",
      "Giờ 15h-17h ít khách, có thể chạy khuyến mãi"
    ],
    "forecast": {
      "nextWeekRevenue": 45000000,
      "nextMonthRevenue": 180000000,
      "confidence": "medium",
      "note": "Dựa trên xu hướng 7 ngày và 12 tháng gần nhất"
    },
    "anomalies": [
      "Doanh thu hôm nay thấp hơn 30% so với trung bình 7 ngày"
    ]
  }
}
```

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `data.insights` | string | Tóm tắt ngắn 2–4 câu: doanh thu, món bán chạy, giờ cao điểm. Tiếng Việt. |
| `data.recommendations` | string[] | 2–4 gợi ý hành động (nguyên liệu, khuyến mãi, ca trực...). Tiếng Việt. |
| `data.forecast` | object | Dự báo doanh thu tuần/tháng tiếp theo. |
| `data.forecast.nextWeekRevenue` | number | Doanh thu dự báo tuần sau (VND). |
| `data.forecast.nextMonthRevenue` | number | Doanh thu dự báo tháng sau (VND). |
| `data.forecast.confidence` | string | `"low"` \| `"medium"` \| `"high"`. |
| `data.forecast.note` | string | Một câu giải thích ngắn. Tiếng Việt. |
| `data.anomalies` | string[] | 0–3 điểm bất thường (ví dụ so với trung bình 7 ngày). Tiếng Việt. Có thể mảng rỗng. |

### 3.2. Khi AI lỗi hoặc không cấu hình

```json
{
  "message": "AI advice fetched",
  "data": null
}
```

FE nên hiển thị thông báo kiểu: *"Không thể tải tư vấn, vui lòng thử lại."*

---

## 4. Lỗi HTTP

| Status | Ý nghĩa |
|--------|--------|
| 401 | Chưa đăng nhập / token sai. |
| 500 | Lỗi server hoặc DB khi lấy dashboard. Body: `{ "error": "Failed to fetch AI advice", "data": null }`. |

---

## 5. Gợi ý tích hợp FE

- **Nút:** Ví dụ "Tư vấn thống kê từ AI" (hoặc icon + text).
- **Khi bấm:**  
  - Gọi `GET /api/statistical/dashboard/ai-advice` (cùng Bearer token như dashboard).  
  - Hiển thị loading (spinner/skeleton) trong lúc chờ.
- **Khi có response:**  
  - Nếu `data !== null`: hiển thị `insights`, `recommendations`, `forecast`, `anomalies` trong **modal**, **drawer**, hoặc **section** mở rộng.  
  - Nếu `data === null`: thông báo "Không thể tải tư vấn, vui lòng thử lại."
- **Lỗi mạng / 500:** Thông báo lỗi, có thể có nút "Thử lại".

---

## 6. Prompt ngắn cho FE (copy)

```
AI Advice: GET /api/statistical/dashboard/ai-advice (Bearer token). Chỉ gọi khi user bấm "Tư vấn thống kê từ AI".

Trả về: message + data. data = { insights, recommendations, forecast: { nextWeekRevenue, nextMonthRevenue, confidence, note }, anomalies } hoặc data = null khi AI lỗi.

FE: bấm nút → gọi API → loading → hiển thị insights/recommendations/forecast/anomalies trong modal/drawer; nếu data null hoặc lỗi thì thông báo thử lại.
```

---

**Base URL:** Theo env (vd. `http://localhost:8080`). Prefix: `/api/statistical`.

# MASTER – API Dashboard / Báo cáo (Admin)

**Dành cho Frontend:** Backend đã làm gì, trả về gì cho trang Dashboard / xem báo cáo. Dùng tài liệu này để tích hợp FE.

---

## 1. Endpoint

```
GET /api/statistical/dashboard
```

**Auth:** Cần gửi token (Bearer). Route dùng `authenticateToken`.  
**Query params:** Không có. Dữ liệu luôn tính theo “hôm nay” và các khoảng chuẩn (7 ngày, 12 tháng, tuần, tháng).

---

## 2. Backend đã làm gì

- **Nguồn ngày/giờ:** Mọi thống kê theo “ngày” đều dùng **`start_time`** của reservation, quy về **giờ Việt Nam (UTC+7)** qua `CONVERT_TZ(start_time, '+00:00', '+07:00')`. Không dùng cột `reservation_date` (schema chỉ có `start_time` / `end_time`).
- **“Hôm nay”:** Là ngày theo giờ VN tại thời điểm gọi API.
- **Tuần:** Tuần báo cáo bắt đầu từ **Thứ Hai** (Monday = đầu tuần, quy ước báo cáo).
- **Reservation theo giờ:** `reservationsByHour` là phân bố theo **giờ (VN)** trong **7 ngày gần nhất** (không phải toàn bộ lịch sử, không chỉ riêng hôm nay).
- **Doanh thu:** Chỉ tính đơn **status = 3 (COMPLETED)** (`total_amount`).
- **Khi không có dữ liệu:** Nếu hôm nay không có reservation và không có doanh thu, backend vẫn trả 200 nhưng **thay bằng dữ liệu mẫu** (sample) để FE có thể vẽ chart / layout; các số là giả định.

---

## 3. Response – Backend trả về gì

**Status 200**

```json
{
  "message": "Dashboard data fetched",
  "data": {
    "executiveSummary": { ... },
    "revenueAnalytics": { ... },
    "menuAnalytics": { ... },
    "reservationAnalytics": { ... },
    "customerAnalytics": { ... },
    "paymentAnalytics": { ... }
  }
}
```

### 3.1. `executiveSummary` (Tổng quan)

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `totalRevenueToday` | number | Doanh thu hôm nay (đơn COMPLETED, theo ngày VN). |
| `revenueGrowthPercent` | number \| null | % thay đổi doanh thu so với hôm qua; null nếu hôm qua = 0. |
| `totalReservationsToday` | number | Số đặt bàn có start_time rơi vào “hôm nay” (VN). |
| `totalOnlineReservations` | number | Số đặt bàn hôm nay, reservation_type = 0 (online). |
| `totalWalkInReservations` | number | Số đặt bàn hôm nay, reservation_type = 1 (walk-in). |
| `totalTables` | number | Tổng số bàn. |
| `tablesOccupied` | number | Số bàn có đơn status 1/2/3 trong ngày (đã xác nhận / đang ăn / hoàn thành). |
| `tablesAvailable` | number | totalTables - tablesOccupied. |
| `tablesReserved` | number | Số bàn có đơn status 0/1 trong ngày (giữ chỗ / đã xác nhận). |
| `totalCustomersToday` | number | Số SĐT khác nhau (distinct) trong đơn có start_time hôm nay (VN). |
| `averageGuestsPerTable` | number | Trung bình khách/bàn hôm nay (totalCustomersToday / tablesOccupied, hoặc 0). |

### 3.2. `revenueAnalytics` (Doanh thu)

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `revenueLast7Days` | array | 7 phần tử: `{ date: "YYYY-MM-DD", revenue: number }`, từ 7 ngày trước đến hôm nay; ngày không có đơn thì revenue = 0. |
| `revenueByMonth` | array | 12 phần tử: `{ month: 1..12, revenue: number }` cho năm hiện tại (theo ngày VN). |
| `comparison` | object | Chênh lệch số tiền (VND): `todayVsYesterday`, `thisWeekVsLastWeek`, `thisMonthVsLastMonth`. |

### 3.3. `menuAnalytics` (Thực đơn)

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `top5BestSellingDishes` | array | Top 5 món bán chạy (đơn COMPLETED): `{ name, quantitySold, revenue }`. |
| `slowSellingDishes` | array | 5 món bán chậm: `{ name, quantitySold }`. |
| `dishCategoryRatio` | array | Tỷ lệ % số lượng theo danh mục: `{ categoryName, percentage }`. |

### 3.4. `reservationAnalytics` (Đặt bàn)

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `reservationsByStatus` | object | Số đơn theo status: `{ "0": n, "1": n, ... }` (0=HOLD, 1=CONFIRMED, 2=CHECKED_IN, 3=COMPLETED, 4=CANCELED, 5=EXPIRED). Toàn bộ lịch sử. |
| `reservationTypeRatio` | object | Số đơn theo loại: `{ "0": n, "1": n }` (online / walk-in). Toàn bộ lịch sử. |
| `reservationsByHour` | array | Phân bố theo giờ (VN) trong **7 ngày gần nhất**: `{ hour: 0..23, total: number }`. |

### 3.5. `customerAnalytics` (Khách hàng)

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `returningCustomers` | number | Số SĐT có nhiều hơn 1 đơn (toàn bộ). |
| `returningRate` | number | % khách quay lại (returningCustomers / unique SĐT). |
| `topSpendingCustomers` | array | Top 5 khách theo tổng chi: `{ name, totalSpent }`. |
| `revenueByCustomerGroup` | object | `{ MEMBER: number, NON_MEMBER: number }` (đơn COMPLETED). |

### 3.6. `paymentAnalytics` (Thanh toán)

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `paymentMethodStats` | array | Theo phương thức (đơn COMPLETED): `{ methodName, totalAmount, percentage }`. |

---

## 4. Lỗi

- **401:** Chưa đăng nhập / token sai.
- **500:** `{ error: "Failed to fetch dashboard data" }` – lỗi server hoặc DB.

---

## 5. Prompt ngắn cho FE (copy)

```
Dashboard API: GET /api/statistical/dashboard (có auth). Không query param.

Backend dùng start_time quy về giờ VN (UTC+7) cho mọi thống kê theo ngày. Trả về data gồm:
- executiveSummary: doanh thu hôm nay, % tăng so hôm qua, số đặt bàn hôm nay, online/walk-in, bàn (tổng/đang dùng/trống/đã đặt), khách hôm nay, TB khách/bàn.
- revenueAnalytics: revenueLast7Days (7 ngày), revenueByMonth (12 tháng), comparison (todayVsYesterday, thisWeekVsLastWeek, thisMonthVsLastMonth).
- menuAnalytics: top5BestSellingDishes, slowSellingDishes, dishCategoryRatio.
- reservationAnalytics: reservationsByStatus, reservationTypeRatio, reservationsByHour (7 ngày gần nhất, giờ VN).
- customerAnalytics: returningCustomers, returningRate, topSpendingCustomers, revenueByCustomerGroup.
- paymentAnalytics: paymentMethodStats.

Tuần tính từ Thứ Hai. Khi không có dữ liệu thật, backend trả dữ liệu mẫu (sample) để FE vẫn vẽ được.
```

---

**Base URL:** Theo env (vd. `http://localhost:8080`). Prefix route: `/api/statistical`.

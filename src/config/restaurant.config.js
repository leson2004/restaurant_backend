/**
 * Static restaurant info for chatbot & app.
 * Override via env: RESTAURANT_NAME, RESTAURANT_ADDRESS, RESTAURANT_OPEN_TIME, etc.
 */
module.exports = {
  name: process.env.RESTAURANT_NAME || "Nhà hàng Hương Việt",
  address: process.env.RESTAURANT_ADDRESS || "Triệu Sơn, Thanh Hóa",
  openTime: process.env.RESTAURANT_OPEN_TIME || "09:00",
  closeTime: process.env.RESTAURANT_CLOSE_TIME || "22:00",
  phone: process.env.RESTAURANT_PHONE || "0123 456 789",
  email: process.env.RESTAURANT_EMAIL || "contact.huongviet@gmail.com",
  facebook: process.env.RESTAURANT_FACEBOOK || "facebook.com/nhahanghuongviet",
  zalo: process.env.RESTAURANT_ZALO || "0123 456 789",
  services: [
    "Ăn tại chỗ",
    "Đặt bàn trước",
    "Tổ chức tiệc",
    "Giao hàng nội khu",
  ],
  reservationGuide:
    "Khách đặt bàn qua website/app: chọn ngày giờ, số khách, nhập thông tin (họ tên, SĐT, email). Có thể chọn bàn và áp dụng mã khuyến mãi. Sau khi đặt, nhà hàng xác nhận qua SĐT/email.",
  /** Link to menu page (for bot reply attachment). Override: MENU_LINK_URL */
  menuLinkUrl: process.env.MENU_LINK_URL || "http://localhost:3001/menu",
  /** Base URL for product images (if image in DB is path like /uploads/...). Override: ASSETS_BASE_URL */
  assetsBaseUrl: process.env.ASSETS_BASE_URL || process.env.BASE_URL || "",
};

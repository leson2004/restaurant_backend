const {
  Product,
  ProductCategory,
  Promotion,
  Table,
  Reservation,
  ReservationDetail,
} = require("../models");
const { Op } = require("sequelize");
const restaurantConfig = require("../config/restaurant.config");

/**
 * Intent types for hybrid chatbot (only fetch relevant data per turn).
 */
const INTENTS = {
  MENU: "menu",
  PROMOTION: "promotion",
  RESERVATION: "reservation",
  TABLE: "table",
  CONTACT: "contact",
  GREETING: "greeting",
  MY_ORDER: "my_order",
  OTHER: "other",
};

/** Reservation status: 0=HOLD, 1=CONFIRMED, 2=CHECKED_IN, 3=COMPLETED, 4=CANCELED, 5=EXPIRED */
const RESERVATION_STATUS_TEXT = {
  0: "Chờ xác nhận",
  1: "Đã xác nhận",
  2: "Đã vào bàn",
  3: "Hoàn thành",
  4: "Đã hủy",
  5: "Hết hạn",
};

/**
 * Get active menu: products with category and description (for semantic answers).
 */
async function getMenuContext() {
  const products = await Product.findAll({
    where: { status: 1 },
    include: [
      {
        model: ProductCategory,
        as: "category",
        attributes: ["name"],
        required: false,
      },
    ],
    attributes: ["name", "price", "sale_price", "description"],
    order: [
      ["categories_id", "ASC"],
      ["name", "ASC"],
    ],
  });

  if (!products.length) {
    return "Hiện chưa có thông tin thực đơn.";
  }

  const byCategory = {};
  products.forEach((p) => {
    const cat = (p.category && p.category.name) || "Khác";
    if (!byCategory[cat]) byCategory[cat] = [];
    const price = Number(p.sale_price) > 0 ? p.sale_price : p.price;
    const desc = p.description && p.description !== "Không có mô tả" ? ` - ${p.description}` : "";
    byCategory[cat].push(`  - ${p.name}: ${Number(price).toLocaleString("vi-VN")}đ${desc}`);
  });

  const lines = [];
  Object.entries(byCategory).forEach(([cat, items]) => {
    lines.push(`[${cat}]\n${items.join("\n")}`);
  });
  return lines.join("\n\n");
}

/**
 * Get 1–2 product image URLs for bot reply when intent is menu.
 * Used to attach dish images to the reply. Returns full URLs (uses assetsBaseUrl if image is path).
 */
async function getMenuImagesForReply() {
  const baseUrl = (restaurantConfig.assetsBaseUrl || "").replace(/\/$/, "");
  const products = await Product.findAll({
    where: { status: 1 },
    attributes: ["image"],
    order: [["id", "ASC"]],
  });
  const withImage = products
    .filter((p) => p.image && String(p.image).trim())
    .slice(0, 2);
  return withImage
    .map((p) => {
      const img = (p.image || "").trim();
      if (!img) return null;
      if (img.startsWith("http://") || img.startsWith("https://"))
        return img;
      return baseUrl ? `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}` : img;
    })
    .filter(Boolean);
}

/**
 * Get active promotions (valid now).
 */
async function getPromotionContext() {
  const now = new Date();
  const promotions = await Promotion.findAll({
    where: {
      valid_from: { [Op.lte]: now },
      valid_to: { [Op.gte]: now },
      quantity: { [Op.gt]: 0 },
    },
    attributes: ["code_name", "discount", "type", "valid_to"],
    order: [["valid_to", "ASC"]],
  });

  if (!promotions.length) {
    return "Hiện không có khuyến mãi đang áp dụng.";
  }

  return promotions
    .map((p) => {
      const endDate = new Date(p.valid_to).toLocaleDateString("vi-VN");
      return `- Mã ${p.code_name}: giảm ${Number(p.discount).toLocaleString("vi-VN")}đ (áp dụng đến ${endDate})`;
    })
    .join("\n");
}

/**
 * Get table summary (capacity, active).
 */
async function getTableContext() {
  const tables = await Table.findAll({
    where: { is_active: true },
    attributes: ["code", "capacity"],
    order: [["capacity", "ASC"]],
  });

  if (!tables.length) {
    return "Hiện chưa có thông tin bàn.";
  }

  const byCapacity = {};
  tables.forEach((t) => {
    const cap = t.capacity;
    if (!byCapacity[cap]) byCapacity[cap] = 0;
    byCapacity[cap]++;
  });
  const summary = Object.entries(byCapacity)
    .map(([cap, count]) => `Bàn ${cap} người: ${count} bàn`)
    .join("; ");
  const list = tables.map((t) => `  - ${t.code} (${t.capacity} người)`).join("\n");
  return `Tổng quan: ${summary}.\nChi tiết:\n${list}`;
}

/**
 * Get static contact & basic info (from config, no DB).
 */
function getContactContext() {
  const r = restaurantConfig;
  return [
    `- Tên: ${r.name}`,
    `- Địa chỉ: ${r.address}`,
    `- Giờ mở cửa: ${r.openTime} - ${r.closeTime}`,
    `- Số điện thoại: ${r.phone}`,
    `- Email: ${r.email}`,
    `- Facebook: ${r.facebook}`,
    `- Zalo: ${r.zalo}`,
    `- Dịch vụ: ${r.services.join(", ")}`,
  ].join("\n");
}

/**
 * Get current customer's reservations (đơn đặt bàn của khách) for my_order intent.
 * Requires customerId (user_id). Returns formatted list or message if not logged in / no data.
 */
async function getMyReservationsContext(customerId) {
  if (!customerId) {
    return "Khách chưa đăng nhập. Chỉ khi đăng nhập, chatbot mới xem được đơn đặt bàn của khách.";
  }

  const reservations = await Reservation.findAll({
    where: { user_id: customerId },
    include: [
      {
        model: Table,
        as: "table",
        attributes: ["code", "capacity"],
        required: false,
      },
      {
        model: ReservationDetail,
        as: "reservation_details",
        attributes: ["quantity", "price"],
        include: [
          {
            model: Product,
            attributes: ["name"],
            required: false,
          },
        ],
      },
    ],
    order: [["start_time", "DESC"]],
    limit: 20,
  });

  if (!reservations.length) {
    return "Khách chưa có đơn đặt bàn nào.";
  }

  const lines = reservations.map((r, idx) => {
    const start = new Date(r.start_time);
    const dateStr = start.toLocaleDateString("vi-VN");
    const timeStr = start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const statusText = RESERVATION_STATUS_TEXT[r.status] ?? `Trạng thái ${r.status}`;
    const tableInfo = r.table ? `Bàn ${r.table.code} (${r.table.capacity} người)` : "Chưa gán bàn";
    const details =
      r.reservation_details && r.reservation_details.length
        ? r.reservation_details
            .map(
              (d) =>
                `    - ${(d.Product && d.Product.name) || "Món"}: ${d.quantity} x ${Number(d.price).toLocaleString("vi-VN")}đ`
            )
            .join("\n")
        : "    (Chưa chọn món)";
    return [
      `Đơn ${idx + 1}: Mã ${r.reservation_code}`,
      `  Ngày giờ: ${dateStr} ${timeStr} | Số khách: ${r.party_size} | ${tableInfo}`,
      `  Trạng thái: ${statusText}`,
      `  Tổng tiền: ${Number(r.total_amount).toLocaleString("vi-VN")}đ | Đặt cọc: ${Number(r.deposit).toLocaleString("vi-VN")}đ`,
      `  Chi tiết món:`,
      details,
    ].join("\n");
  });

  return lines.join("\n\n");
}

/**
 * Get reservation guide (static + table + promotion summary).
 */
async function getReservationContext() {
  const [tableCtx, promoCtx] = await Promise.all([
    getTableContext(),
    getPromotionContext(),
  ]);
  const guide = restaurantConfig.reservationGuide;
  return [
    "Quy trình đặt bàn:",
    guide,
    "",
    "Thông tin bàn:",
    tableCtx,
    "",
    "Khuyến mãi có thể áp dụng khi đặt bàn:",
    promoCtx,
  ].join("\n");
}

/**
 * Build context string for Gemini based on intent.
 * Only fetches DB data relevant to the user question.
 * @param {string} intent
 * @param {string} _message
 * @param {{ customerId?: number }} options - customerId required for my_order intent
 */
async function getContextByIntent(intent, _message, options = {}) {
  const r = restaurantConfig;
  const base = {
    name: r.name,
    contactBrief: `Tên: ${r.name}. Địa chỉ: ${r.address}. Giờ: ${r.openTime}-${r.closeTime}. Liên hệ: ${r.phone}, ${r.email}.`,
  };
  const customerId = options.customerId ?? null;

  switch (intent) {
    case INTENTS.MY_ORDER:
      return {
        ...base,
        menu: null,
        promotion: null,
        table: null,
        contact: null,
        reservation: null,
        myOrder: await getMyReservationsContext(customerId),
      };
    case INTENTS.MENU:
      return {
        ...base,
        menu: await getMenuContext(),
        promotion: null,
        table: null,
        contact: null,
        reservation: null,
        myOrder: null,
      };
    case INTENTS.PROMOTION:
      return {
        ...base,
        menu: null,
        promotion: await getPromotionContext(),
        table: null,
        contact: null,
        reservation: null,
        myOrder: null,
      };
    case INTENTS.TABLE:
      return {
        ...base,
        menu: null,
        promotion: null,
        table: await getTableContext(),
        contact: null,
        reservation: null,
        myOrder: null,
      };
    case INTENTS.CONTACT:
      return {
        ...base,
        menu: null,
        promotion: null,
        table: null,
        contact: getContactContext(),
        reservation: null,
        myOrder: null,
      };
    case INTENTS.RESERVATION:
      return {
        ...base,
        menu: null,
        promotion: null,
        table: null,
        contact: null,
        reservation: await getReservationContext(),
        myOrder: null,
      };
    case INTENTS.GREETING:
      return {
        ...base,
        menu: null,
        promotion: null,
        table: null,
        contact: getContactContext(),
        reservation: null,
        myOrder: null,
      };
    case INTENTS.OTHER:
    default:
      // Unknown or broad question: fetch menu + promotion + contact (no table/reservation detail to keep context smaller)
      const [menu, promotion, contact] = await Promise.all([
        getMenuContext(),
        getPromotionContext(),
        Promise.resolve(getContactContext()),
      ]);
      return {
        ...base,
        menu,
        promotion,
        table: null,
        contact,
        reservation: null,
        myOrder: null,
      };
  }
}

module.exports = {
  INTENTS,
  getContextByIntent,
  getMenuContext,
  getMenuImagesForReply,
  getPromotionContext,
  getTableContext,
  getContactContext,
  getReservationContext,
  getMyReservationsContext,
};

const { GoogleGenAI } = require("@google/genai");
const {
  INTENTS,
  getContextByIntent,
  getMenuImagesForReply,
} = require("./chatbotContext.service");
const restaurantConfig = require("../config/restaurant.config");

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-3-flash-preview";

const INTENT_LIST = [
  INTENTS.MENU,
  INTENTS.PROMOTION,
  INTENTS.RESERVATION,
  INTENTS.TABLE,
  INTENTS.CONTACT,
  INTENTS.GREETING,
  INTENTS.MY_ORDER,
  INTENTS.OTHER,
].join(", ");

/**
 * Classify user message intent so we only fetch relevant DB data (hybrid approach).
 * Returns one of: menu, promotion, reservation, table, contact, greeting, my_order, other
 */
async function classifyIntent(message) {
  const trimmed = (message || "").trim().toLowerCase();
  if (!trimmed) return INTENTS.GREETING;

  const intentPrompt = `Bạn là classifier. Chỉ trả lời ĐÚNG MỘT từ sau, không thêm gì: ${INTENT_LIST}

Quy tắc:
- Hỏi về món ăn, thực đơn, giá, món nào ngon, món theo mùa/giảm cân/cảm → menu
- Hỏi về khuyến mãi, giảm giá, mã giảm → promotion
- Hỏi đặt bàn, đặt chỗ, đặt tiệc, quy trình đặt (chung) → reservation
- Hỏi về bàn, sức chứa, bàn bao nhiêu người → table
- Hỏi địa chỉ, giờ mở cửa, SĐT, liên hệ, email, facebook, zalo → contact
- Chào, xin chào, hello, tạm biệt, cảm ơn (ngắn) → greeting
- Hỏi về đơn của mình, đơn đã đặt, đặt bàn của tôi, tôi đã đặt, trạng thái đơn, đơn hàng của tôi → my_order
- Không rõ hoặc nhiều chủ đề → other

Câu của khách: "${trimmed}"

Trả lời (chỉ một từ):`;

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: intentPrompt,
    });
    const text = (
      result.text ||
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      ""
    )
      .trim()
      .toLowerCase();
    const intent = INTENT_LIST.split(", ").find((i) => text.includes(i));
    return intent || INTENTS.OTHER;
  } catch (err) {
    console.error("Gemini classifyIntent error:", err.message);
    return INTENTS.OTHER;
  }
}

/**
 * Hybrid AI Chatbot: intent → fetch only relevant context from DB → generate reply.
 * @param {string} message - User message
 * @param {{ customerId?: number }} options - customerId (senderId) from socket; required for answering "đơn của tôi"
 */
async function chatWithCustomer(message, options = {}) {
  try {
    const intent = await classifyIntent(message);
    const context = await getContextByIntent(intent, message, {
      customerId: options.customerId ?? null,
    });

    const sections = [];
    if (context.menu) sections.push(`THỰC ĐƠN (từ CSDL):\n${context.menu}`);
    if (context.promotion)
      sections.push(`KHUYẾN MÃI HIỆN TẠI (từ CSDL):\n${context.promotion}`);
    if (context.table)
      sections.push(`THÔNG TIN BÀN (từ CSDL):\n${context.table}`);
    if (context.contact)
      sections.push(`LIÊN HỆ & THÔNG TIN CHUNG:\n${context.contact}`);
    if (context.reservation)
      sections.push(`HƯỚNG DẪN ĐẶT BÀN:\n${context.reservation}`);
    if (context.myOrder != null)
      sections.push(`ĐƠN ĐẶT BÀN CỦA KHÁCH (từ CSDL):\n${context.myOrder}`);

    const contextBlock =
      sections.length > 0
        ? sections.join("\n\n")
        : `Thông tin cơ bản: ${context.contactBrief}`;

    const prompt = `Bạn là chatbot tư vấn của nhà hàng "${context.name}".

MỤC TIÊU:
- Trả lời ngắn gọn, thân thiện, chuyên nghiệp bằng tiếng Việt.
- CHỈ dựa vào DỮ LIỆU dưới đây để trả lời; không bịa thông tin.
- Nếu không có thông tin trong dữ liệu, nói lịch sự "Hiện tôi chưa có thông tin này" hoặc gợi ý liên hệ nhà hàng.
- Chỉ nói về nhà hàng; câu hỏi lạc đề → từ chối lịch sự.
- Chào hỏi / cảm ơn / tạm biệt → phản hồi tự nhiên, vui vẻ.
- Hỏi món (menu, giá, món phù hợp mùa/giảm cân/cảm, gia đình 4 người): dựa vào THỰC ĐƠN và mô tả món để gợi ý.
- Hỏi khuyến mãi: dựa vào KHUYẾN MÃI. Hỏi đặt bàn: dựa vào HƯỚNG DẪN ĐẶT BÀN.
- Hỏi địa chỉ, giờ, liên hệ: dựa vào LIÊN HỆ.
- Hỏi về đơn đã đặt / đơn của tôi: dựa vào mục ĐƠN ĐẶT BÀN CỦA KHÁCH; nếu dữ liệu báo "chưa đăng nhập" hoặc "chưa có đơn" thì trả lời đúng như vậy.
- Khi trả lời về thực đơn/món ăn: sắp xếp rõ ràng (đoạn ngắn, có thể bullet), dễ đọc; kết thúc bằng gợi ý xem thực đơn và đặt bàn trên website (không cần ghi URL trong text, backend sẽ gửi link riêng).

DỮ LIỆU NHÀ HÀNG (chỉ dùng thông tin dưới đây):
${contextBlock}

CÂU KHÁCH HỎI:
"${(message || "").trim()}"

Trả lời ngắn gọn, đúng trọng tâm, dễ đọc:`;

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const text =
      result.text ||
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể nói lại không?";
    const replyText = text.trim();

    // Menu intent: attach 1–2 dish images + link to menu (for FE to show images and CTA)
    if (intent === INTENTS.MENU) {
      const imageUrls = await getMenuImagesForReply();
      const menuUrl = restaurantConfig.menuLinkUrl || "http://localhost:3001/menu";
      const attachments = {
        images: imageUrls,
        link: {
          url: menuUrl,
          label: "Xem thực đơn & đặt bàn",
        },
      };
      return { text: replyText, attachments };
    }

    return replyText;
  } catch (err) {
    console.error("Gemini chatWithCustomer error:", err);
    return "Xin lỗi, hiện chatbot đang gặp sự cố. Vui lòng thử lại sau.";
  }
}

module.exports = { chatWithCustomer, classifyIntent };

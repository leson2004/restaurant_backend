const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const restaurant = {
  name: "Nhà hàng Hương Việt",
  address: "123 Trần Phú, Hà Nội",
  openTime: "09:00",
  closeTime: "22:00",
  phone: "0123 456 789",
  services: ["Ăn tại chỗ", "Đặt bàn trước"],
  menu: [
    { name: "Phở bò", price: "45.000đ" },
    { name: "Bún chả", price: "50.000đ" },
    { name: "Nem rán", price: "30.000đ" },
    { name: "Cơm tấm", price: "55.000đ" },
  ],
};

const chatWithCustomer = async (message) => {
  try {
    const menuText = restaurant.menu
      .map((item) => `- ${item.name}: ${item.price}`)
      .join("\n");

    const prompt = `
Bạn là chatbot tư vấn của ${restaurant.name}.

QUY ĐỊNH:
- Chỉ trả lời các câu hỏi liên quan đến nhà hàng
- Trả lời lịch sự, ngắn gọn, dễ hiểu

THÔNG TIN NHÀ HÀNG:
- Địa chỉ: ${restaurant.address}
- Giờ mở cửa: ${restaurant.openTime} - ${restaurant.closeTime}
- SĐT: ${restaurant.phone}
- Dịch vụ: ${restaurant.services.join(", ")}

THỰC ĐƠN:
${menuText}

KHÁCH HỎI:
${message}
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: "Lỗi chatbot Gemini" });
  }
};
module.exports = { chatWithCustomer };

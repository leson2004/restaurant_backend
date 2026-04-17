"use strict";

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// gemini-2.0-flash-exp bị 404 với API v1beta; dùng model ổn định
const MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";

/**
 * Generate AI analytics (insights, recommendations, forecast, anomalies) from dashboard data.
 * Called only when user clicks "Tư vấn thống kê từ AI". On Gemini error returns null.
 *
 * @param {Object} dashboardData - Full dashboard object from getDashboardDataService()
 * @returns {Promise<Object|null>} { insights, recommendations, forecast, anomalies } or null
 */
async function generateDashboardAIAdvice(dashboardData) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === "") {
    console.warn("[Dashboard AI] GEMINI_API_KEY not set, skipping dashboard AI advice");
    return null;
  }

  const summary = dashboardData.executiveSummary || {};
  const revenue = dashboardData.revenueAnalytics || {};
  const menu = dashboardData.menuAnalytics || {};
  const reservation = dashboardData.reservationAnalytics || {};
  const customer = dashboardData.customerAnalytics || {};
  const payment = dashboardData.paymentAnalytics || {};

  const revenueLast7Days = revenue.revenueLast7Days || [];
  const avgRevenue7Days =
    revenueLast7Days.length > 0
      ? revenueLast7Days.reduce((s, d) => s + Number(d.revenue || 0), 0) /
        revenueLast7Days.length
      : 0;
  const todayRevenue = Number(summary.totalRevenueToday) || 0;
  const deviationFromAvg =
    avgRevenue7Days > 0
      ? Number(
          (((todayRevenue - avgRevenue7Days) / avgRevenue7Days) * 100).toFixed(
            2,
          ),
        )
      : null;

  const dataContext = JSON.stringify(
    {
      executiveSummary: summary,
      revenueAnalytics: {
        revenueLast7Days,
        revenueByMonth: revenue.revenueByMonth,
        comparison: revenue.comparison,
        _computed: {
          avgRevenueLast7Days: Math.round(avgRevenue7Days),
          todayVsAvg7DaysPercent: deviationFromAvg,
        },
      },
      menuAnalytics: {
        top5BestSellingDishes: menu.top5BestSellingDishes,
        slowSellingDishes: menu.slowSellingDishes,
        dishCategoryRatio: menu.dishCategoryRatio,
      },
      reservationAnalytics: {
        reservationsByStatus: reservation.reservationsByStatus,
        reservationTypeRatio: reservation.reservationTypeRatio,
        reservationsByHour: reservation.reservationsByHour,
      },
      customerAnalytics: {
        returningCustomers: customer.returningCustomers,
        returningRate: customer.returningRate,
        topSpendingCustomers: customer.topSpendingCustomers,
        revenueByCustomerGroup: customer.revenueByCustomerGroup,
      },
      paymentAnalytics: payment.paymentMethodStats,
    },
    null,
    2,
  );

  const prompt = `Bạn là chuyên gia phân tích kinh doanh cho nhà hàng. Dựa ĐÚNG vào dữ liệu thống kê dưới đây (đơn vị tiền: VND), hãy trả lời ĐÚNG MỘT khối JSON hợp lệ, không markdown, không \`\`\`json.

DỮ LIỆU THỐNG KÊ:
${dataContext}

YÊU CẦU:
1. insights: Một đoạn văn ngắn (2-4 câu) tóm tắt tình hình: doanh thu hôm nay so với hôm qua/trung bình, món bán chạy, giờ cao điểm. Viết bằng tiếng Việt.
2. recommendations: Mảng 2-4 gợi ý hành động cụ thể (chuẩn bị nguyên liệu, khuyến mãi, ca trực...) bằng tiếng Việt.
3. forecast: Object gồm nextWeekRevenue (số VND dự báo tuần sau), nextMonthRevenue (số VND dự báo tháng sau), confidence ("low"|"medium"|"high"), note (một câu giải thích ngắn bằng tiếng Việt).
4. anomalies: Mảng 0-3 điểm bất thường (ví dụ: "Doanh thu hôm nay thấp hơn 30% so với trung bình 7 ngày"). Nếu không có bất thường thì mảng rỗng []. Tiếng Việt.

Chỉ trả về JSON, không thêm text nào khác. Format:
{"insights":"...","recommendations":["...","..."],"forecast":{"nextWeekRevenue":0,"nextMonthRevenue":0,"confidence":"medium","note":"..."},"anomalies":["..."]}`;

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const rawText =
      result.text ||
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";
    const trimmed = rawText.trim().replace(/^```json\s*|\s*```$/g, "").trim();

    if (!trimmed) {
      console.warn(
        "[Dashboard AI] Gemini returned empty text. Blocked or no candidates?",
        "result.keys:",
        result ? Object.keys(result) : "no result",
      );
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (parseErr) {
      console.warn("[Dashboard AI] Invalid JSON from Gemini:", parseErr.message);
      console.warn("[Dashboard AI] First 200 chars:", trimmed.slice(0, 200));
      return null;
    }

    if (
      typeof parsed.insights !== "string" ||
      !Array.isArray(parsed.recommendations) ||
      !parsed.forecast ||
      typeof parsed.forecast.nextWeekRevenue !== "number" ||
      typeof parsed.forecast.nextMonthRevenue !== "number" ||
      !Array.isArray(parsed.anomalies)
    ) {
      console.warn("[Dashboard AI] Invalid shape from Gemini:", JSON.stringify(parsed).slice(0, 300));
      return null;
    }

    return {
      insights: parsed.insights,
      recommendations: parsed.recommendations,
      forecast: {
        nextWeekRevenue: parsed.forecast.nextWeekRevenue,
        nextMonthRevenue: parsed.forecast.nextMonthRevenue,
        confidence: parsed.forecast.confidence || "medium",
        note: parsed.forecast.note || "",
      },
      anomalies: parsed.anomalies,
    };
  } catch (err) {
    console.error("[Dashboard AI] Gemini API error:", err.message);
    if (err.status) console.error("[Dashboard AI] status:", err.status);
    return null;
  }
}

module.exports = {
  generateDashboardAIAdvice,
};

const { getDashboardDataService } = require("../services/dashboard.service");
const {
  generateDashboardAIAdvice,
} = require("../services/geminiDashboard.service");

const getDashboard = async (req, res) => {
  try {
    const data = await getDashboardDataService();
    return res.status(200).json({ message: "Dashboard data fetched", data });
  } catch (error) {
    console.error("dashboard error", error);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

/**
 * GET /api/statistical/dashboard/ai-advice
 * Called when user clicks "Tư vấn thống kê từ AI". Fetches dashboard data, calls Gemini once,
 * returns insights, recommendations, forecast, anomalies. On AI error returns data: null.
 */
const getDashboardAIAdvice = async (req, res) => {
  try {
    const dashboardData = await getDashboardDataService();
    const aiAnalytics = await generateDashboardAIAdvice(dashboardData);
    return res.status(200).json({
      message: "AI advice fetched",
      data: aiAnalytics,
    });
  } catch (error) {
    console.error("dashboard AI advice error", error);
    return res.status(500).json({
      error: "Failed to fetch AI advice",
      data: null,
    });
  }
};

module.exports = { getDashboard, getDashboardAIAdvice };

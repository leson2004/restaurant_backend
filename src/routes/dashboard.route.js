const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

// GET /statistical/dashboard (protected)
router.get("/dashboard", dashboardController.getDashboard);
// GET /statistical/dashboard/ai-advice (protected) – only when user clicks "Tư vấn thống kê từ AI"
router.get("/dashboard/ai-advice", dashboardController.getDashboardAIAdvice);

module.exports = router;

import {
  getRevenueByYearService,
  getRevenueByDateRangeService,
} from "../services/revenue.service.js";

const getRevenueByYear = async (req, res) => {
  try {
    const { year } = req.query;

    const selectedYear = year ? parseInt(year, 10) : new Date().getFullYear();

    // Validate
    if (isNaN(selectedYear) || selectedYear < 2000) {
      return res.status(400).json({
        message: "Năm không hợp lệ",
      });
    }

    const data = await getRevenueByYearService(selectedYear);

    return res.status(200).json({
      message: `Doanh thu và thống kê đơn hàng cho năm ${selectedYear}`,
      ...data,
    });
  } catch (error) {
    console.error("Lỗi controller doanh thu:", error);
    return res.status(500).json({
      message: "Lấy doanh thu thất bại",
    });
  }
};
const getRevenueByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate
    if (!startDate || !endDate) {
      return res.status(400).json({
        message:
          "Vui lòng truyền đầy đủ startDate và endDate theo định dạng YYYY-MM-DD.",
      });
    }

    const start = new Date(`${startDate} 00:00:00`);
    const end = new Date(`${endDate} 23:59:59`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Định dạng ngày không hợp lệ.",
      });
    }

    const result = await getRevenueByDateRangeService(start, end);

    return res.status(200).json({
      message: `Thống kê doanh thu từ ${startDate} đến ${endDate}`,
      startDate,
      endDate,
      ...result,
    });
  } catch (error) {
    console.error("Lỗi controller thống kê doanh thu:", error);
    return res.status(500).json({
      message: "Không thể lấy dữ liệu doanh thu.",
    });
  }
};
export { getRevenueByYear, getRevenueByDateRange };

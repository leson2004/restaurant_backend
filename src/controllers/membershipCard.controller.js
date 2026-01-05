const membershipCardService = require("../services/membershipCard.service");

const getMembershipCardByUserId = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({
      message: "user_id là bắt buộc",
    });
  }

  try {
    const result = await membershipCardService.getMembershipCardByUserId(
      user_id
    );

    return res.status(200).json({
      message: "Lấy dữ liệu thành công",
      result,
    });
  } catch (error) {
    console.error("Error fetching membership card:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy thông tin thẻ hội viên.",
    });
  }
};

module.exports = {
  getMembershipCardByUserId,
};

const membershipTierService = require("../services/membershipTier.service");

const getAll = async (req, res) => {
  try {
    const result = await membershipTierService.getAllMembershipTiers();

    return res.status(200).json({
      message: "Lấy dữ liệu thành công",
      result,
    });
  } catch (error) {
    console.error("Error fetching membership tiers:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy thông tin thẻ hội viên.",
    });
  }
};
const getMembershipLevel = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({
      message: "user_id là bắt buộc",
    });
  }

  try {
    const result = await membershipService.getMembershipLevelByUserId(user_id);

    return res.status(200).json({
      message: "Lấy dữ liệu thành công",
      userPoints: result.userPoints,
      tierName: result.tierName,
    });
  } catch (error) {
    console.error("Error fetching membership level:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Có lỗi xảy ra",
    });
  }
};

module.exports = {
  getAll,
  getMembershipLevel,
};

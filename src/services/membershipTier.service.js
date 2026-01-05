const { MembershipTier, MembershipCard } = require("../models/index");

const getAllMembershipTiers = async () => {
  const tiers = await MembershipTier.findAll();

  if (!tiers || tiers.length === 0) {
    throw {
      status: 404,
      message: "Không tìm thấy thông tin thẻ hội viên.",
    };
  }

  return tiers;
};
const getMembershipLevelByUserId = async (userId) => {
  // 1. Lấy điểm người dùng
  const membershipCard = await MembershipCard.findOne({
    where: { user_id: userId },
    attributes: ["point"],
  });

  if (!membershipCard) {
    throw {
      status: 404,
      message: "Thẻ thành viên không tìm thấy",
    };
  }

  const userPoints = membershipCard.point;

  // 2. Lấy danh sách hạng thẻ (giảm dần theo điểm)
  const tiers = await MembershipTier.findAll({
    attributes: ["name", "point"],
    order: [["point", "DESC"]],
  });

  if (!tiers || tiers.length === 0) {
    throw {
      status: 404,
      message: "Không tìm thấy cấp độ thành viên nào",
    };
  }

  // 3. Tìm hạng phù hợp
  const matchingTier = tiers.find((tier) => userPoints >= tier.point);

  if (!matchingTier) {
    throw {
      status: 404,
      message: "Không tìm thấy cấp độ tương ứng với số điểm hiện tại",
    };
  }

  return {
    userPoints,
    tierName: matchingTier.name,
  };
};

module.exports = {
  getAllMembershipTiers,
  getMembershipLevelByUserId,
};

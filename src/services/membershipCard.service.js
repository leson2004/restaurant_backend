const { MembershipCard, User } = require("../models");

const getMembershipCardByUserId = async (userId) => {
  const membershipCard = await MembershipCard.findOne({
    where: { user_id: userId },
    include: [
      {
        model: User,
        attributes: ["fullname"],
      },
    ],
  });

  if (!membershipCard) {
    throw {
      status: 404,
      message: "Không tìm thấy thông tin thẻ hội viên cho user_id này.",
    };
  }

  return membershipCard;
};

module.exports = {
  getMembershipCardByUserId,
};

const { sequelize } = require("../models");
const changeDishService = require("../services/changeDish.service");

const sendChangeDish = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { dishes, dishList, customerInfo, currentTotal, VAT10, discount } =
      req.body;

    //  Validate cơ bản
    if (!customerInfo || !dishList?.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
      });
    }

    await changeDishService.sendChangeDishRequest(
      {
        dishes,
        dishList,
        customerInfo,
        currentTotal,
        VAT10,
        discount,
      },
      transaction,
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Email yêu cầu đổi món đã được gửi và cập nhật thành công",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Change dish error:", error);

    return res.status(500).json({
      message: "Không thể xử lý yêu cầu đổi món",
    });
  }
};

module.exports = {
  sendChangeDish,
};

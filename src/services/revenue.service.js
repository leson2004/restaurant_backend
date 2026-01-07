import { sequelize } from "../configs/database.js";
import Reservation from "../models/reservation.model.js";

const statusMapping = {
  0: "Hủy đơn",
  1: "Chờ thanh toán cọc",
  2: "Hết hạn thanh toán cọc",
  3: "Đã thanh toán cọc",
  4: "Chờ thanh toán toàn bộ đơn",
  5: "Hoàn thành đơn",
};

const getRevenueByYearService = async (year) => {
  const transaction = await sequelize.transaction();

  try {
    const results = await Reservation.findAll({
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("reservation_date")), "month"],
        "status",
        [sequelize.fn("COUNT", sequelize.col("*")), "orderCount"],
        [
          sequelize.literal(`
                        CASE 
                            WHEN status = 5 THEN SUM(total_amount)
                            WHEN status = 0 THEN SUM(deposit)
                            ELSE 0
                        END
                    `),
          "totalRevenue",
        ],
      ],
      where: sequelize.where(
        sequelize.fn("YEAR", sequelize.col("reservation_date")),
        year
      ),
      group: [
        sequelize.fn("MONTH", sequelize.col("reservation_date")),
        "status",
      ],
      order: [
        [sequelize.fn("MONTH", sequelize.col("reservation_date")), "ASC"],
        ["status", "ASC"],
      ],
      raw: true,
      transaction,
    });

    const monthlyRevenue = Array(12).fill(0);

    const revenueByMonthAndStatus = Array.from({ length: 12 }, () => ({
      "Hủy đơn": 0,
      "Chờ thanh toán cọc": 0,
      "Hết hạn thanh toán cọc": 0,
      "Đã thanh toán cọc": 0,
      "Chờ thanh toán toàn bộ đơn": 0,
      "Hoàn thành đơn": 0,
    }));

    results.forEach((row) => {
      const monthIndex = row.month - 1;

      if (row.status === 5 || row.status === 0) {
        monthlyRevenue[monthIndex] += Number(row.totalRevenue) || 0;
      }

      const statusName = statusMapping[row.status];
      if (statusName) {
        revenueByMonthAndStatus[monthIndex][statusName] +=
          Number(row.orderCount) || 0;
      }
    });

    await transaction.commit();

    return {
      year,
      monthlyRevenue,
      revenueByMonthAndStatus,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getRevenueByDateRangeService = async (startDate, endDate) => {
  const transaction = await sequelize.transaction();

  try {
    const result = await Reservation.findOne({
      attributes: [
        [
          sequelize.literal(`
                        SUM(
                            CASE 
                                WHEN status = 5 THEN total_amount
                                WHEN status = 0 THEN deposit
                                ELSE 0
                            END
                        )
                    `),
          "totalRevenue",
        ],
        [sequelize.fn("COUNT", sequelize.col("*")), "orderCount"],
      ],
      where: {
        reservation_date: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
      raw: true,
      transaction,
    });

    await transaction.commit();

    return {
      totalRevenue: Number(result?.totalRevenue) || 0,
      orderCount: Number(result?.orderCount) || 0,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
export { getRevenueByYearService, getRevenueByDateRangeService };

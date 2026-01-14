const { ReservationDetail, sequelize } = require("../models/index");

const getAllReservationDetails = async (transaction = null) => {
  try {
    const data = await ReservationDetail.findAll({
      transaction,
    });

    return data;
  } catch (error) {
    throw new Error("Failed to fetch reservation details");
  }
};
const getReservationDetailById = async (id, transaction = null) => {
  try {
    const reservationDetail = await ReservationDetail.findByPk(id, {
      transaction,
    });

    if (!reservationDetail) {
      throw new Error("RESERVATION_DETAIL_NOT_FOUND");
    }

    return reservationDetail;
  } catch (error) {
    throw error;
  }
};
const createReservationDetailService = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    const { reservation_id, product_id, quantity, price } = data;

    const reservationDetail = await ReservationDetail.create(
      {
        reservation_id,
        product_id,
        quantity,
        price,
      },
      { transaction }
    );

    await transaction.commit();

    return reservationDetail;
  } catch (error) {
    await transaction.rollback();
    console.log("error detail", error);
    throw {
      status: 500,
      message: "Failed to create reservation detail",
    };
  }
};
const updateReservationDetailById = async (id, data, transaction) => {
  try {
    const reservationDetail = await ReservationDetail.findByPk(id, {
      transaction,
    });

    if (!reservationDetail) {
      throw new Error("RESERVATION_DETAIL_NOT_FOUND");
    }

    await reservationDetail.update(
      {
        reservation_id: data.reservation_id,
        product_id: data.product_id,
        quantity: data.quantity,
        price: data.price,
      },
      { transaction }
    );

    return reservationDetail;
  } catch (error) {
    throw error;
  }
};
const deleteReservationDetailById = async (id, transaction) => {
  try {
    const reservationDetail = await ReservationDetail.findByPk(id, {
      transaction,
    });

    if (!reservationDetail) {
      throw new Error("RESERVATION_DETAIL_NOT_FOUND");
    }

    await reservationDetail.destroy({ transaction });

    return true;
  } catch (error) {
    throw error;
  }
};
module.exports = {
  getAllReservationDetails,
  getReservationDetailById,
  updateReservationDetailById,
  deleteReservationDetailById,
  createReservationDetailService,
};

const db = require("../models");

const getAllReservationDetails = async (transaction = null) => {
  try {
    const data = await db.ReservationDetail.findAll({
      transaction,
    });

    return data;
  } catch (error) {
    throw new Error("Failed to fetch reservation details");
  }
};
const getReservationDetailById = async (id, transaction = null) => {
  try {
    const reservationDetail = await db.ReservationDetail.findByPk(id, {
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
const updateReservationDetailById = async (id, data, transaction) => {
  try {
    const reservationDetail = await db.ReservationDetail.findByPk(id, {
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
    const reservationDetail = await db.ReservationDetail.findByPk(id, {
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
};

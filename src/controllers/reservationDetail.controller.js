const db = require("../models");
const reservationDetailService = require("../services/reservationDetail.service");

const getAllReservationDetails = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    // 👉 Không cần validate dữ liệu đầu vào vì không có params/body

    const reservationDetails =
      await reservationDetailService.getAllReservationDetails(transaction);

    await transaction.commit();

    return res.status(200).json(reservationDetails);
  } catch (error) {
    await transaction.rollback();

    console.error("Error fetching reservation details:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};
const getReservationDetailById = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Invalid reservation detail id",
      });
    }

    const reservationDetail =
      await reservationDetailService.getReservationDetailById(id, transaction);

    await transaction.commit();

    return res.status(200).json(reservationDetail);
  } catch (error) {
    await transaction.rollback();

    if (error.message === "RESERVATION_DETAIL_NOT_FOUND") {
      return res.status(404).json({
        error: "Reservation detail not found",
      });
    }

    console.error("Error fetching reservation detail:", error);
    return res.status(500).json({
      error: "Failed to fetch reservation detail",
    });
  }
};
const updateReservationDetailById = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { reservation_id, product_id, quantity, price } = req.body;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Invalid reservation detail id",
      });
    }

    if (!reservation_id || !product_id || !quantity || !price) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    if (quantity <= 0 || price <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Quantity and price must be greater than 0",
      });
    }

    await reservationDetailService.updateReservationDetailById(
      id,
      { reservation_id, product_id, quantity, price },
      transaction
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Reservation detail updated successfully",
    });
  } catch (error) {
    await transaction.rollback();

    if (error.message === "RESERVATION_DETAIL_NOT_FOUND") {
      return res.status(404).json({
        error: "Reservation detail not found",
      });
    }

    console.error("Error updating reservation detail:", error);
    return res.status(500).json({
      error: "Failed to update reservation detail",
    });
  }
};
const deleteReservationDetailById = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Invalid reservation detail id",
      });
    }

    await reservationDetailService.deleteReservationDetailById(id, transaction);

    await transaction.commit();

    return res.status(200).json({
      message: "Reservation detail deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();

    if (error.message === "RESERVATION_DETAIL_NOT_FOUND") {
      return res.status(404).json({
        error: "Reservation detail not found",
      });
    }

    console.error("Error deleting reservation detail:", error);
    return res.status(500).json({
      error: "Failed to delete reservation detail",
    });
  }
};
module.exports = {
  getAllReservationDetails,
  getReservationDetailById,
  updateReservationDetailById,
  deleteReservationDetailById,
};

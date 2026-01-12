const reservationAdminService = require("../services/reservationAdmin.service");

const changeDishes = async (req, res) => {
  try {
    // ✅ Validate trong controller
    const reservationId = req.body.selecteReservation_id;
    let dishesArray = req.body.selectedChangedishes;

    if (!reservationId) {
      return res.status(400).json({ message: "reservation_id is required" });
    }

    if (!dishesArray) {
      return res
        .status(400)
        .json({ message: "selectedChangedishes is required" });
    }

    if (!Array.isArray(dishesArray)) {
      dishesArray = JSON.parse(dishesArray);
    }

    const totalPayable =
      dishesArray.length > 0 ? dishesArray[0].total_amount : 0;

    await reservationAdminService.changeDishesService(
      reservationId,
      dishesArray,
      totalPayable
    );

    return res.status(200).json({
      message: "Changed dishes updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to change dishes",
      error: error.message,
    });
  }
};
const markReservationNotChange = async (req, res) => {
  try {
    const reservationId = req.body.selecteReservation_id;

    // ✅ Validate trong controller
    if (!reservationId) {
      return res.status(400).json({
        message: "reservation_id is required.",
      });
    }

    await reservationAdminService.markReservationNotChangeService(
      reservationId
    );

    return res.status(200).json({
      message: "Reservation updated successfully.",
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation not found.",
      });
    }

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
const addTableToReservation = async (req, res) => {
  try {
    const { reservationID } = req.body;

    // ✅ Validate trong controller
    if (!reservationID) {
      return res.status(400).json({
        message: "reservationID is required",
      });
    }

    const tableId = await reservationAdminService.addTableToReservationService(
      reservationID
    );

    return res.status(200).json({
      message: "Ghép bàn thành công!",
      table_id: tableId,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Đặt bàn không tồn tại hoặc không hợp lệ.",
      });
    }

    if (error.message === "NO_SUITABLE_TABLE") {
      return res.status(400).json({
        message: "Không có bàn phù hợp để ghép.",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
//getAllReservationsService
const getMyBookings = async (req, res) => {
  try {
    const { user_id } = req.params;

    // ✅ Validate trong controller
    if (!user_id) {
      return res.status(400).json({
        message: "user_id is required",
      });
    }

    const data = await reservationAdminService.getMyBookingsService(
      user_id,
      req.query
    );

    return res.status(200).json({
      message: "Show list reservations successfully",
      ...data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch reservations",
      error: error.message,
    });
  }
};
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id) {
      return res.status(400).json({
        message: "Reservation id is required",
      });
    }

    const reservation = await reservationAdminService.getReservationByIdService(
      id
    );

    // ⚠️ Giữ format response giống code cũ
    return res.status(200).json({
      message: "Show list reservations successfully",
      results: [reservation],
      totalCount: 1,
      totalPages: 1,
      currentPage: 1,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch reservation",
    });
  }
};
const getReservationDetailsByReservationId = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    // ✅ Validate trong controller
    if (!reservation_id) {
      return res.status(400).json({
        message: "reservation_id is required",
      });
    }

    const results =
      await reservationAdminService.getReservationDetailsByReservationIdService(
        reservation_id
      );

    return res.status(200).json({
      message: "Show list reservation_details successfully",
      results,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch reservation_details",
    });
  }
};

//
const updateReservation = async (req, res) => {
  const reservationId = req.params.id;
  const {
    fullname,
    tel,
    email,
    reservation_date,
    party_size,
    note,
    total_amount,
    status,
    products,
  } = req.body;

  // ✅ VALIDATE TRONG CONTROLLER
  if (!fullname || !tel || !reservation_date || status == null) {
    return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
  }

  try {
    await reservationAdminService.updateReservation(reservationId, {
      fullname,
      tel,
      email,
      reservation_date,
      party_size,
      note,
      total_amount,
      status,
      products,
    });

    res.json({
      message: "Cập nhật thông tin đặt chỗ và trạng thái bàn thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Cập nhật thất bại",
      error: error.message,
    });
  }
};
const patchReservation = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // ✅ Validate trong controller
  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "Không có dữ liệu cập nhật" });
  }

  try {
    await reservationAdminService.patchReservationStatus(id, updates);

    res.status(200).json({
      message: "Reservation and table status updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to partially update reservations",
      error: error.message,
    });
  }
};
const deleteReservationDetail = async (req, res) => {
  const { reservationId, productId } = req.params;

  // ✅ Validate trong controller
  if (!reservationId || !productId) {
    return res.status(400).json({
      message: "reservationId and productId are required",
    });
  }

  try {
    await reservationAdminService.deleteProductFromReservation(
      reservationId,
      productId
    );

    res.status(200).json({
      message: "Product deleted successfully from reservation",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete product from reservation",
      error: error.message,
    });
  }
};
const getExistingReservations = async (req, res) => {
  try {
    const existingCodes =
      await reservationAdminService.getExistingReservationCodes();

    res.status(200).json(existingCodes);
  } catch (error) {
    console.error("Error fetching existing reservations:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const createReservation = async (req, res) => {
  try {
    const {
      reservation_code,
      fullname,
      email,
      tel,
      reservation_date,
      status,
      partySize,
      totalAmount,
    } = req.body;

    // ✅ Validate trong controller
    if (
      !reservation_code ||
      !fullname ||
      !tel ||
      !reservation_date ||
      !partySize
    ) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    const reservationId = await reservationService.createReservation(req.body);

    res.status(201).json({
      message: "Đặt bàn thành công",
      reservationId,
    });
  } catch (error) {
    console.error("Create reservation error:", error);
    res.status(500).json({
      message: error.message || "Lỗi tạo đặt bàn",
    });
  }
};
const filterByDate = async (req, res) => {
  try {
    const { date, page = 1, pageSize = 8 } = req.query;

    // ✅ Validate trong controller
    if (!date) {
      return res.status(400).json({ error: "Ngày là bắt buộc" });
    }

    const data = await reservationAdminService.filterTablesByDate({
      date,
      page,
      pageSize,
    });

    res.status(200).json({
      message: "Hiển thị danh sách bàn theo ngày thành công",
      ...data,
    });
  } catch (error) {
    console.error("Filter table error:", error);
    res.status(500).json({
      error: "Không thể lấy danh sách bàn",
    });
  }
};

module.exports = {
  changeDishes,
  markReservationNotChange,
  addTableToReservation,
  getReservationById,
  getReservationDetailsByReservationId,
  updateReservation,
  patchReservation,
  getExistingReservations,
  createReservation,
  filterByDate,
  getMyBookings,
  deleteReservationDetail,
};

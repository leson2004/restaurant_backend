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
      totalPayable,
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
      reservationId,
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

    const tableId =
      await reservationAdminService.addTableToReservationService(reservationID);

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
/**
 * GET /reservations_t_admin/list
 * Danh sách đặt bàn cho trang quản lý admin (lọc theo ngày, giờ, bàn, trạng thái, quick view).
 */
const getReservationList = async (req, res) => {
  try {
    const {
      date,
      time_from,
      time_to,
      table_id,
      status,
      quick_view,
      searchName,
      searchPhone,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const data = await reservationAdminService.getReservationListService({
      date: date || undefined,
      time_from: time_from || undefined,
      time_to: time_to || undefined,
      table_id: table_id || undefined,
      status: status || undefined,
      quick_view: quick_view || undefined,
      searchName: searchName || "",
      searchPhone: searchPhone || "",
      page: pageNum,
      limit: limitNum,
    });

    return res.status(200).json({
      message: "Danh sách đặt bàn",
      ...data,
    });
  } catch (error) {
    console.error("Get reservation list error:", error);
    return res.status(500).json({
      message: "Lỗi lấy danh sách đặt bàn",
      error: error.message,
    });
  }
};

//getAllReservationsService
const getAllReservations = async (req, res) => {
  try {
    const {
      searchName = "",
      searchPhone = "",
      searchEmail = "",
      status = "",
      reservation_code = "",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // ✅ Validate trong controller
    if (pageNumber <= 0 || limitNumber <= 0) {
      return res.status(400).json({
        message: "Page và limit phải là số dương",
      });
    }

    const { totalCount, reservations } =
      await reservationAdminService.getAllReservationsService({
        searchName,
        searchPhone,
        searchEmail,
        status,
        reservation_code,
        page: pageNumber,
        limit: limitNumber,
      });

    res.status(200).json({
      message: "Show list reservations successfully",
      results: reservations,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
      limit: limitNumber,
    });
  } catch (error) {
    console.error("Get reservations error:", error);
    res.status(500).json({
      message: "Failed to fetch reservations",
      error: error.message,
    });
  }
};

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
      req.query,
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

    const reservation =
      await reservationAdminService.getReservationByIdService(id);

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
        reservation_id,
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
      productId,
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

    const reservationId = await reservationAdminService.createReservation(
      req.body,
    );

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
const getTimeline = async (req, res) => {
  try {
    const { date, party_size, page, limit } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });
    }
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (
      !Number.isInteger(pageNum) ||
      pageNum < 1 ||
      !Number.isInteger(limitNum) ||
      limitNum < 1
    ) {
      return res.status(400).json({
        message: "page and limit are required and must be positive integers",
      });
    }

    const data = await reservationAdminService.getTimelineService({
      date,
      party_size,
      page: pageNum,
      limit: limitNum,
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Timeline error:", error);
    return res.status(500).json({
      message: "Failed to fetch timeline",
      error: error.message,
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

// Get available tables for admin quick create reservation
const getAvailableTables = async (req, res) => {
  try {
    const { date, start, end, party_size } = req.query;

    // Validate required parameters
    if (!date || !start || !end || !party_size) {
      return res.status(400).json({
        message: "date, start, end, and party_size are required",
      });
    }

    // Dynamically import the service function
    const { getAvailableTablesService } =
      await import("../services/reservation.service.js");

    const availableTables = await getAvailableTablesService(
      date,
      start,
      end,
      party_size,
    );

    return res.status(200).json(availableTables);
  } catch (error) {
    console.error("Get available tables error:", error);

    if (error.message === "MISSING_REQUIRED_FIELDS") {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (error.message === "INVALID_DATE_FORMAT") {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (error.message === "INVALID_TIME_RANGE") {
      return res
        .status(400)
        .json({ message: "Start time must be before end time" });
    }

    if (error.message === "INVALID_PARTY_SIZE") {
      return res.status(400).json({ message: "Invalid party size" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create admin walk-in reservation
const createAdminReservation = async (req, res) => {
  try {
    const {
      table_id,
      fullname,
      tel,
      email,
      party_size,
      start_time,
      end_time,
      note,
      reservation_type,
      status,
      deposit,
    } = req.body;

    // Validate required fields
    if (
      !table_id ||
      !fullname ||
      !tel ||
      !party_size ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        message:
          "table_id, fullname, tel, party_size, start_time, and end_time are required",
      });
    }

    // Dynamically import the service function
    const { createAdminWalkInReservationService } =
      await import("../services/reservation.service.js");

    const reservation = await createAdminWalkInReservationService({
      table_id,
      fullname,
      tel,
      email,
      party_size,
      start_time,
      end_time,
      note,
      reservation_type,
      status,
      deposit,
    });

    return res.status(201).json(reservation);
  } catch (error) {
    console.error("Create admin reservation error:", error);

    if (error.message === "MISSING_REQUIRED_FIELDS") {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (error.message === "INVALID_PARTY_SIZE") {
      return res.status(400).json({ message: "Invalid party size" });
    }

    if (error.message === "INVALID_TIME_FORMAT") {
      return res.status(400).json({ message: "Invalid time format" });
    }

    if (error.message === "INVALID_TIME_RANGE") {
      return res
        .status(400)
        .json({ message: "Start time must be before end time" });
    }

    if (error.message === "TABLE_NOT_FOUND") {
      return res.status(404).json({ message: "Table not found" });
    }

    if (error.message === "TABLE_INACTIVE") {
      return res.status(400).json({ message: "Table is not active" });
    }

    if (error.message === "TABLE_NOT_AVAILABLE") {
      return res.status(400).json({
        message: "Table is not available for the selected time range",
      });
    }

    if (error.message === "FAILED_TO_GENERATE_RESERVATION_CODE") {
      return res
        .status(500)
        .json({ message: "Failed to generate reservation code" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * 1️⃣ API GET DETAIL - Lấy chi tiết reservation với tính toán
 * GET /reservations_t_admin/:id
 */
const getReservationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate
    if (!id) {
      return res.status(400).json({
        message: "Reservation id is required",
      });
    }

    const reservation =
      await reservationAdminService.getReservationDetailService(id);

    return res.status(200).json({
      message: "Reservation detail fetched successfully",
      data: reservation,
    });
  } catch (error) {
    console.error("Get reservation detail error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch reservation detail",
      error: error.message,
    });
  }
};

/**
 * 2️⃣ API THANH TOÁN CỌC
 * POST /reservations_t_admin/:id/pay-deposit
 * Body: { method: "CASH" | "BANK" | "MOMO" | "ZALOPAY" }
 */
const payDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body;

    // ✅ Validate
    if (!id) {
      return res.status(400).json({
        message: "Reservation id is required",
      });
    }

    if (!method) {
      return res.status(400).json({
        message: "Payment method is required",
      });
    }

    const validMethods = ["CASH", "BANK", "MOMO", "ZALOPAY"];
    if (!validMethods.includes(method.toUpperCase())) {
      return res.status(400).json({
        message: `Invalid payment method. Must be one of: ${validMethods.join(", ")}`,
      });
    }

    const updatedReservation = await reservationAdminService.payDepositService(
      id,
      method.toUpperCase(),
    );

    return res.status(200).json({
      message: "Deposit payment processed successfully",
      data: updatedReservation,
    });
  } catch (error) {
    console.error("Pay deposit error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (error.message === "INVALID_STATUS") {
      return res.status(400).json({
        message: "Reservation is not in HOLD status",
      });
    }

    if (error.message === "HOLD_EXPIRED") {
      return res.status(400).json({
        message: "Hold period has expired, cannot pay deposit",
      });
    }

    if (error.message === "DEPOSIT_ALREADY_PAID") {
      return res.status(400).json({
        message: "Deposit has already been paid for this reservation",
      });
    }

    return res.status(500).json({
      message: "Failed to process deposit payment",
      error: error.message,
    });
  }
};

/**
 * 3️⃣ API UPDATE MÓN KHI HOLD
 * PUT /reservations_t_admin/:id/items/:detailId
 * Body: { quantity, price }
 */
const updateReservationItem = async (req, res) => {
  try {
    const { id: reservationId, detailId } = req.params;
    const { quantity, price } = req.body;

    // ✅ Validate
    if (!reservationId) {
      return res.status(400).json({
        message: "Reservation id is required",
      });
    }

    if (!detailId) {
      return res.status(400).json({
        message: "Detail id is required",
      });
    }

    const updatedItem =
      await reservationAdminService.updateReservationItemService(
        reservationId,
        detailId,
        quantity,
        price,
      );

    return res.status(200).json({
      message: "Reservation item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Update reservation item error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (error.message === "CANNOT_MODIFY_ITEMS_NOT_ON_HOLD") {
      return res.status(400).json({
        message: "Can only modify items when reservation is in HOLD status",
      });
    }

    if (error.message === "DETAIL_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation item not found",
      });
    }

    return res.status(500).json({
      message: "Failed to update reservation item",
      error: error.message,
    });
  }
};

/**
 * 3️⃣ API DELETE MÓN KHI HOLD
 * DELETE /reservations_t_admin/:id/items/:detailId
 */
const deleteReservationItem = async (req, res) => {
  try {
    const { id: reservationId, detailId } = req.params;

    // ✅ Validate
    if (!reservationId) {
      return res.status(400).json({
        message: "Reservation id is required",
      });
    }

    if (!detailId) {
      return res.status(400).json({
        message: "Detail id is required",
      });
    }

    const result = await reservationAdminService.deleteReservationItemService(
      reservationId,
      detailId,
    );

    return res.status(200).json({
      message: "Reservation item deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete reservation item error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (error.message === "CANNOT_MODIFY_ITEMS_NOT_ON_HOLD") {
      return res.status(400).json({
        message: "Can only delete items when reservation is in HOLD status",
      });
    }

    if (error.message === "DETAIL_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation item not found",
      });
    }

    return res.status(500).json({
      message: "Failed to delete reservation item",
      error: error.message,
    });
  }
};

/**
 * 3️⃣ API ADD MÓN KHI HOLD
 * POST /reservations_t_admin/:id/items
 * Body: { product_id, quantity, price (optional) }
 */
const addReservationItem = async (req, res) => {
  try {
    const { id: reservationId } = req.params;
    const { product_id, quantity, price } = req.body;

    // ✅ Validate
    if (!reservationId) {
      return res.status(400).json({
        message: "Reservation id is required",
      });
    }

    if (!product_id) {
      return res.status(400).json({
        message: "Product id is required",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    const newItem = await reservationAdminService.addReservationItemService(
      reservationId,
      product_id,
      quantity,
      price,
    );

    return res.status(201).json({
      message: "Reservation item added successfully",
      data: newItem,
    });
  } catch (error) {
    console.error("Add reservation item error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (error.message === "CANNOT_MODIFY_ITEMS_NOT_ON_HOLD") {
      return res.status(400).json({
        message: "Can only add items when reservation is in HOLD status",
      });
    }

    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(500).json({
      message: "Failed to add reservation item",
      error: error.message,
    });
  }
};

/**
 * 2️⃣ Check-in CONFIRMED reservation
 * POST /reservations_t_admin/:id/check-in
 */
const checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Reservation id is required" });
    }

    const updated = await reservationAdminService.checkInService(id);
    return res.status(200).json({
      message: "Đã check-in thành công",
      reservation: updated,
    });
  } catch (error) {
    console.error("Check-in error", error);
    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Reservation not found" });
    }
    if (error.message === "INVALID_STATUS") {
      return res.status(400).json({ message: "Reservation is not CONFIRMED" });
    }
    if (error.message === "TOO_EARLY_TO_CHECKIN") {
      return res
        .status(400)
        .json({ message: "Check-in time has not arrived yet" });
    }
    return res
      .status(500)
      .json({ message: "Failed to check-in", error: error.message });
  }
};

/**
 * 3️⃣ Cancel CONFIRMED reservation
 * POST /reservations_t_admin/:id/cancel
 */
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    let { refund_type } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Reservation id is required" });
    }
    if (!refund_type) {
      return res.status(400).json({ message: "refund_type is required" });
    }
    refund_type = refund_type.toUpperCase();

    const { refund_amount, reservation } =
      await reservationAdminService.cancelReservationService(id, refund_type);

    return res.status(200).json({
      message: "Hủy đơn thành công",
      refund_amount,
      reservation,
    });
  } catch (error) {
    console.error("Cancel reservation error", error);
    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Reservation not found" });
    }
    if (error.message === "INVALID_STATUS") {
      return res.status(400).json({ message: "Reservation is not CONFIRMED" });
    }
    if (error.message === "INVALID_REFUND_TYPE") {
      return res.status(400).json({ message: "Invalid refund_type" });
    }
    return res
      .status(500)
      .json({ message: "Failed to cancel reservation", error: error.message });
  }
};

/**
 * 4️⃣ Change table on CONFIRMED reservation
 * PUT /reservations_t_admin/:id/change-table
 */
const changeTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { table_id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Reservation id is required" });
    }
    if (!table_id) {
      return res.status(400).json({ message: "table_id is required" });
    }

    const result = await reservationAdminService.changeTableService(
      id,
      table_id,
    );
    return res.status(200).json({
      message: "Đổi bàn thành công",
      old_table_id: result.old_table_id,
      new_table_id: result.new_table_id,
      reservation: result.reservation,
    });
  } catch (error) {
    console.error("Change table error", error);
    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Reservation not found" });
    }
    if (error.message === "INVALID_STATUS") {
      return res.status(400).json({ message: "Reservation is not CONFIRMED" });
    }
    if (error.message === "TABLE_NOT_FOUND") {
      return res.status(404).json({ message: "New table not found" });
    }
    if (
      error.message === "TABLE_TOO_SMALL" ||
      error.message === "TABLE_NOT_AVAILABLE"
    ) {
      return res.status(400).json({ message: "Table not available" });
    }
    return res
      .status(500)
      .json({ message: "Failed to change table", error: error.message });
  }
};

/**
 * 5️⃣ Fetch available tables
 * GET /tables/available?start_time=&end_time=&party_size=
 */
const listAvailableTables = async (req, res) => {
  try {
    const { start_time, end_time, party_size } = req.query;
    const data = await reservationAdminService.getAvailableTablesService({
      start_time,
      end_time,
      party_size: parseInt(party_size, 10),
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error("List available tables error", error);
    if (error.message === "MISSING_PARAMETERS") {
      return res
        .status(400)
        .json({ message: "start_time, end_time and party_size are required" });
    }
    return res
      .status(500)
      .json({
        message: "Failed to fetch available tables",
        error: error.message,
      });
  }
};

/* ================= CHECKED_IN (POS) WORKFLOW CONTROLLERS ================= */

/**
 * 1️⃣ Add items to a CONFIRMED or CHECKED_IN reservation
 * POST /reservations_t_admin/:id/add-item
 * Body: { items: [{ product_id, quantity, price }, ...] }
 */
const addCheckedInItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Reservation id is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required" });
    }

    const result = await reservationAdminService.addCheckedInItemService(
      id,
      items,
    );
    return res.status(201).json(result);
  } catch (error) {
    console.error("Add checked-in item error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (
      error.message === "INVALID_STATUS_MUST_BE_CHECKED_IN" ||
      error.message === "INVALID_STATUS_MUST_BE_CONFIRMED_OR_CHECKED_IN"
    ) {
      return res.status(400).json({
        message: "Reservation must be CONFIRMED or CHECKED_IN",
      });
    }

    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Product not found" });
    }

    if (error.message === "INVALID_QUANTITY") {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    return res
      .status(500)
      .json({ message: "Failed to add item", error: error.message });
  }
};

/**
 * 2️⃣ Update item in a CONFIRMED or CHECKED_IN reservation
 * PUT /reservations_t_admin/:id/update-item
 * Body: { product_id, quantity, price }
 */
const updateCheckedInItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity, price } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Reservation id is required" });
    }

    if (!product_id) {
      return res.status(400).json({ message: "product_id is required" });
    }

    if (!quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    const result = await reservationAdminService.updateCheckedInItemService(
      id,
      {
        product_id,
        quantity,
        price,
      },
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Cập nhật món thành công",
    });
  } catch (error) {
    console.error("Update checked-in item error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (error.message === "INVALID_STATUS_MUST_BE_CHECKED_IN") {
      return res
        .status(400)
        .json({ message: "Reservation is not in CHECKED_IN status" });
    }

    if (error.message === "DETAIL_NOT_FOUND") {
      return res
        .status(404)
        .json({ message: "Product not found in reservation" });
    }

    if (error.message === "INVALID_QUANTITY") {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    return res
      .status(500)
      .json({ message: "Failed to update item", error: error.message });
  }
};

/**
 * 3️⃣ Remove item from a CONFIRMED or CHECKED_IN reservation
 * DELETE /reservations_t_admin/:id/remove-item?product_id=5
 */
const removeCheckedInItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Reservation id is required" });
    }

    if (!product_id) {
      return res.status(400).json({ message: "product_id is required" });
    }

    const result = await reservationAdminService.removeCheckedInItemService(
      id,
      product_id,
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Remove checked-in item error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (error.message === "INVALID_STATUS_MUST_BE_CHECKED_IN") {
      return res
        .status(400)
        .json({ message: "Reservation is not in CHECKED_IN status" });
    }

    if (error.message === "DETAIL_NOT_FOUND") {
      return res
        .status(404)
        .json({ message: "Product not found in reservation" });
    }

    return res
      .status(500)
      .json({ message: "Failed to remove item", error: error.message });
  }
};

/**
 * 4️⃣ Preview bill (no database writes)
 * GET /reservations_t_admin/:id/preview-bill
 * Query (optional): voucher_code, special_promotion_id, point_used
 */
const previewBill = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      voucher_code = "",
      special_promotion_id,
      point_used,
    } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Reservation id is required" });
    }

    const options = {};
    if (voucher_code != null) options.voucher_code = voucher_code;
    if (special_promotion_id != null && special_promotion_id !== "") {
      options.special_promotion_id = parseInt(special_promotion_id, 10);
    }
    if (point_used != null && point_used !== "") {
      options.point_used = parseFloat(point_used) || 0;
    }

    const result = await reservationAdminService.previewBillService(id, options);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Preview bill error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (error.message === "PROMOTION_INVALID") {
      return res
        .status(400)
        .json({ message: "Mã không hợp lệ hoặc đã hết hạn." });
    }

    return res
      .status(500)
      .json({ message: "Failed to preview bill", error: error.message });
  }
};

/**
 * 5️⃣ Complete CHECKED_IN reservation (finalize payment)
 * POST /reservations_t_admin/:id/complete
 * Body: { voucher_code, special_promotion_id, point_used, payment_method, amount_received }
 */
const completeReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      voucher_code = "",
      special_promotion_id = null,
      point_used = 0,
      payment_method,
      amount_received,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Reservation id is required" });
    }

    if (!payment_method) {
      return res.status(400).json({ message: "payment_method is required" });
    }

    const result = await reservationAdminService.completeReservationService(
      id,
      {
        voucher_code,
        special_promotion_id,
        point_used,
        payment_method,
        amount_received,
      },
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Complete reservation error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (error.message === "INVALID_STATUS_MUST_BE_CHECKED_IN") {
      return res
        .status(400)
        .json({ message: "Reservation is not in CHECKED_IN status" });
    }

    if (error.message === "INVALID_PAYMENT_METHOD") {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    if (error.message === "INSUFFICIENT_CASH") {
      return res
        .status(400)
        .json({ message: "Amount received is less than amount due" });
    }

    if (error.message === "PROMOTION_INVALID") {
      return res
        .status(400)
        .json({ message: "Mã không hợp lệ hoặc đã hết hạn." });
    }

    return res
      .status(500)
      .json({
        message: "Failed to complete reservation",
        error: error.message,
      });
  }
};

module.exports = {
  changeDishes,
  markReservationNotChange,
  addTableToReservation,
  getTimeline,
  getReservationById,
  getReservationDetailsByReservationId,
  updateReservation,
  patchReservation,
  getExistingReservations,
  createReservation,
  filterByDate,
  getMyBookings,
  deleteReservationDetail,
  getAllReservations,
  getReservationList,
  getAvailableTables,
  createAdminReservation,
  // 🆕 HOLD Feature controllers
  getReservationDetail,
  payDeposit,
  updateReservationItem,
  deleteReservationItem,
  addReservationItem,
  // 🆕 CONFIRMED Flow controllers
  checkIn,
  cancelReservation,
  changeTable,
  listAvailableTables,
  // 🆕 CHECKED_IN (POS) Workflow controllers
  addCheckedInItem,
  updateCheckedInItem,
  removeCheckedInItem,
  previewBill,
  completeReservation,
};

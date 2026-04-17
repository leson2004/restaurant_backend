import {
  holdReservationService,
  updateCustomerInfoService,
  addOrUpdateReservationItemsService,
  getReservationByIdService,
  getPaymentPreviewService,
  cancelReservationByIdService,
  applyPromotionService,
} from "../services/reservation.service.js";

// 🔥 Luồng mới: Bước 1-2 – chỉ giữ bàn (HOLD) 10 phút
export const holdReservation = async (req, res) => {
  try {
    const { date, time, party_size } = req.body;

    // ✅ Validate core fields trong controller
    if (!date || !time || !party_size) {
      return res.status(400).json({
        error: "date, time, party_size are required",
      });
    }

    const result = await holdReservationService(req.body);

    return res.status(201).json({
      message: "Hold reservation created successfully",
      reservation_id: result.reservationId,
      table_id: result.tableId,
      start_time: result.start_time,
      end_time: result.end_time,
      hold_expired_at: result.hold_expired_at,
      reservation_code: result.reservation_code,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "NO_AVAILABLE_TABLE") {
      return res.status(400).json({ error: "No available table" });
    }

    if (error.message === "MISSING_CORE_FIELDS") {
      return res.status(400).json({ error: "Missing core fields" });
    }

    if (error.message === "INVALID_RESERVATION_TIME") {
      return res.status(400).json({ error: "Invalid reservation time" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

// 🔥 Update customer information for HOLD reservation
export const updateCustomerInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, tel, email, note, user_id } = req.body;

    // ✅ Validate reservation ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid reservation ID",
      });
    }

    // ✅ Validate required fields
    if (!fullname || !tel) {
      return res.status(400).json({
        error: "fullname and tel are required",
      });
    }

    const result = await updateCustomerInfoService(id, {
      fullname,
      tel,
      email,
      note,
      user_id,
    });

    return res.status(200).json({
      message: "Customer information updated successfully",
      reservation: result,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    if (error.message === "RESERVATION_NOT_IN_HOLD_STATUS") {
      return res.status(400).json({
        error: "Reservation is not in HOLD status",
      });
    }

    if (error.message === "RESERVATION_EXPIRED") {
      return res.status(400).json({
        error: "Reservation hold has expired",
      });
    }

    if (error.message === "MISSING_REQUIRED_FIELDS") {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

// 🔥 Add or update pre-ordered items for a reservation
export const addOrUpdateReservationItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    // ✅ Validate reservation ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid reservation ID",
      });
    }

    // ✅ Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "items array is required and must not be empty",
      });
    }

    const result = await addOrUpdateReservationItemsService(id, items);

    return res.status(200).json({
      message: "Reservation items updated successfully",
      reservation: result,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    if (error.message === "RESERVATION_NOT_ELIGIBLE_FOR_ITEMS") {
      return res.status(400).json({
        error: "Reservation must be in HOLD or CONFIRMED status",
      });
    }

    if (error.message === "ITEMS_REQUIRED") {
      return res.status(400).json({
        error: "Items array is required",
      });
    }

    if (error.message === "INVALID_ITEM_FORMAT") {
      return res.status(400).json({
        error: "Each item must have product_id and quantity",
      });
    }

    if (error.message === "INVALID_ITEM_QUANTITY") {
      return res.status(400).json({
        error: "Item quantity must be greater than 0",
      });
    }

    if (error.message && error.message.startsWith("PRODUCTS_NOT_FOUND")) {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

// 🔍 Get reservation detail by ID (READ-ONLY)
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate reservation ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid reservation ID",
      });
    }

    const reservation = await getReservationByIdService(id);

    // ✅ Shape response to only include required fields
    const response = {
      id: reservation.id,
      reservation_code: reservation.reservation_code,
      status: reservation.status,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      hold_expired_at: reservation.hold_expired_at,
      fullname: reservation.fullname,
      tel: reservation.tel,
      email: reservation.email,
      note: reservation.note,
      total_amount: reservation.total_amount,
      deposit: reservation.deposit,
      reservation_details: Array.isArray(reservation.reservation_details)
        ? reservation.reservation_details.map((detail) => ({
            id: detail.id,
            reservation_id: detail.reservation_id,
            product_id: detail.product_id,
            quantity: detail.quantity,
            price: detail.price,
            product: detail.Product
              ? {
                  id: detail.Product.id,
                  name: detail.Product.name,
                  price: detail.Product.price,
                  sale_price: detail.Product.sale_price,
                }
              : null,
          }))
        : [],
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

// 🔍 Get payment preview (total_amount) by reservation ID (READ-ONLY)
export const getPaymentPreview = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate reservation ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid reservation ID",
      });
    }

    const preview = await getPaymentPreviewService(id);

    return res.status(200).json({
      reservation_id: preview.reservationId,
      total_amount: preview.total_amount,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

// Áp dụng mã giảm giá cho đặt bàn (chỉ validate + tính toán, không cập nhật DB)
export const applyPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!id || isNaN(id)) {
      return res.status(400).json({
        applied: false,
        message: "Invalid reservation ID",
      });
    }

    const result = await applyPromotionService(parseInt(id, 10), body);
    return res.status(200).json(result);
  } catch (error) {
    const applied = error.applied === false;
    const message = error.message || "Mã không hợp lệ hoặc đã hết.";
    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ applied: false, message: "Đặt bàn không tồn tại." });
    }
    if (error.message === "RESERVATION_NOT_HOLD" || error.message === "PROMOTION_REQUIRED" || error.message === "PROMOTION_INVALID") {
      return res.status(400).json({ applied: false, message: message || error.message });
    }
    return res.status(500).json({ applied: false, message: "Lỗi máy chủ." });
  }
};

// ❌ Manually cancel a reservation (HOLD or CONFIRMED only)
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate reservation ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid reservation ID",
      });
    }

    const result = await cancelReservationByIdService(id);

    return res.status(200).json({
      reservation_id: result.reservationId,
      status: result.status,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    if (error.message === "RESERVATION_CANNOT_BE_CANCELED") {
      return res.status(400).json({
        error: "Reservation cannot be canceled in its current status",
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

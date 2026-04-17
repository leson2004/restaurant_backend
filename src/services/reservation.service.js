import {
  sequelize,
  Reservation,
  Table,
  ReservationDetail,
  Product,
  Promotion,
} from "../models/index.js";
import { Op } from "sequelize";

/** Vietnam timezone offset for reservation "local" date (display & filtering) */
const VIETNAM_OFFSET = "+07:00";

/**
 * Parse ISO or datetime string as Vietnam time when no timezone is given.
 * So "2026-03-07T02:27:00" is treated as 7 Mar 2026 02:27 in Vietnam, not server local.
 */
const parseAsVietnamIfNeeded = (value) => {
  if (value == null) return null;
  const s = typeof value === "string" ? value.trim() : String(value);
  if (!s) return null;
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  const withTz = s.endsWith("Z") ? s : `${s}${VIETNAM_OFFSET}`;
  return new Date(withTz);
};

/**
 * Format a Date to ISO string in Vietnam time (YYYY-MM-DDTHH:mm:ss+07:00)
 * so response "date" part matches what user selected.
 */
const toVietnamISOString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const y = vn.getUTCFullYear();
  const m = String(vn.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vn.getUTCDate()).padStart(2, "0");
  const h = String(vn.getUTCHours()).padStart(2, "0");
  const min = String(vn.getUTCMinutes()).padStart(2, "0");
  const sec = String(vn.getUTCSeconds()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}:${sec}${VIETNAM_OFFSET}`;
};

/**
 * Generate unique reservation code
 * Format: HS{8-digit random number}
 */
const generateReservationCode = () => {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return `HS${randomNumber}`;
};

/**
 * Find an available table that doesn't conflict with existing reservations
 * @param {Date} startTime - Reservation start time
 * @param {Date} endTime - Reservation end time
 * @param {number} partySize - Number of guests
 * @returns {Promise<number|null>} Table ID or null if no table available
 */
const findAvailableTable = async (startTime, endTime, partySize) => {
  // Find all active tables with sufficient capacity
  const suitableTables = await Table.findAll({
    where: {
      capacity: { [Op.gte]: partySize },
      is_active: true,
    },
    order: [["capacity", "ASC"]], // Prefer smaller tables first
  });

  if (suitableTables.length === 0) {
    return null;
  }

  // Check each table for conflicts
  for (const table of suitableTables) {
    // Find conflicting reservations
    // Conflict exists if:
    // - Reservation status is HOLD (0), CONFIRMED (1), or CHECKED_IN (2)
    // - Time ranges overlap: (start_time < requested_end_time) AND (end_time > requested_start_time)
    const conflictingReservation = await Reservation.findOne({
      where: {
        table_id: table.id,
        status: { [Op.in]: [0, 1, 2] }, // HOLD, CONFIRMED, CHECKED_IN
        [Op.and]: [
          { start_time: { [Op.lt]: endTime } },
          { end_time: { [Op.gt]: startTime } },
        ],
      },
    });

    // If no conflict, this table is available
    if (!conflictingReservation) {
      return table.id;
    }
  }

  return null;
};

/**
 * Create a temporary reservation (HOLD)
 * @param {object} data - { date, time, party_size }
 * @returns {Promise<object>} Reservation details
 */
const holdReservationService = async ({ date, time, party_size, user_id }) => {
  // Validate input
  if (!date || !time || !party_size) {
    throw new Error("MISSING_CORE_FIELDS");
  }

  // Validate party_size
  const partySize = parseInt(party_size, 10);
  if (isNaN(partySize) || partySize <= 0) {
    throw new Error("INVALID_PARTY_SIZE");
  }

  // Parse date and time to create start_time
  const dateTimeString = `${date} ${time}`;
  const startTime = new Date(dateTimeString);

  // Validate date/time
  if (isNaN(startTime.getTime())) {
    throw new Error("INVALID_RESERVATION_TIME");
  }

  // Check if reservation time is in the past
  if (startTime < new Date()) {
    throw new Error("INVALID_RESERVATION_TIME");
  }

  // Calculate end_time (default: 2 hours after start_time)
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 2);

  // Find available table
  const tableId = await findAvailableTable(startTime, endTime, partySize);

  if (!tableId) {
    throw new Error("NO_AVAILABLE_TABLE");
  }

  // Generate unique reservation code
  let reservationCode = generateReservationCode();
  let codeExists = true;
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure reservation code is unique
  while (codeExists && attempts < maxAttempts) {
    const existing = await Reservation.findOne({
      where: { reservation_code: reservationCode },
    });
    if (!existing) {
      codeExists = false;
    } else {
      reservationCode = generateReservationCode();
      attempts++;
    }
  }

  if (codeExists) {
    throw new Error("FAILED_TO_GENERATE_RESERVATION_CODE");
  }

  // Calculate hold expiration (10 minutes from now)
  const holdExpiredAt = new Date();
  holdExpiredAt.setMinutes(holdExpiredAt.getMinutes() + 10);

  // Create reservation with HOLD status
  // Note: fullname and tel are required in model, so we'll use placeholder values
  // These will be updated in the next step when customer enters their info
  const createPayload = {
    reservation_code: reservationCode,
    table_id: tableId,
    fullname: "Pending", // Placeholder, will be updated
    tel: "0000000000", // Placeholder, will be updated
    party_size: partySize,
    start_time: startTime,
    end_time: endTime,
    hold_expired_at: holdExpiredAt,
    status: 0, // HOLD
    reservation_type: 0, // ONLINE
    total_amount: 0,
    deposit: 0,
  };
  if (user_id != null && user_id !== "") {
    createPayload.user_id = parseInt(user_id, 10) || null;
  }
  const reservation = await Reservation.create(createPayload);

  return {
    reservationId: reservation.id,
    reservation_code: reservation.reservation_code,
    tableId: reservation.table_id,
    start_time: reservation.start_time,
    end_time: reservation.end_time,
    hold_expired_at: reservation.hold_expired_at,
  };
};

/**
 * Update customer information for a HOLD reservation
 * @param {number} reservationId - Reservation ID
 * @param {object} customerInfo - { fullname, tel, email?, note? }
 * @returns {Promise<object>} Updated reservation details
 */
const updateCustomerInfoService = async (reservationId, customerInfo) => {
  const { fullname, tel, email, note, user_id } = customerInfo;

  // Validate required fields
  if (!fullname || !tel) {
    throw new Error("MISSING_REQUIRED_FIELDS");
  }

  // Find the reservation
  const reservation = await Reservation.findByPk(reservationId);

  if (!reservation) {
    throw new Error("RESERVATION_NOT_FOUND");
  }

  // Check if reservation is in HOLD status
  if (reservation.status !== 0) {
    throw new Error("RESERVATION_NOT_IN_HOLD_STATUS");
  }

  // Check if hold has expired
  const now = new Date();
  if (
    reservation.hold_expired_at &&
    new Date(reservation.hold_expired_at) < now
  ) {
    // Mark reservation as EXPIRED
    await reservation.update({
      status: 5, // EXPIRED
    });
    throw new Error("RESERVATION_EXPIRED");
  }

  // Update customer information
  const updateData = {
    fullname,
    tel,
  };

  // Email and note are optional
  if (email !== undefined) {
    updateData.email = email;
  }
  if (note !== undefined) {
    updateData.note = note;
  }
  // Lưu user_id nếu khách đã đăng nhập (để hiển thị trong "Lịch sử đặt bàn")
  if (user_id != null && user_id !== "") {
    const uid = parseInt(user_id, 10);
    if (!Number.isNaN(uid)) updateData.user_id = uid;
  }

  await reservation.update(updateData);

  // Return updated reservation
  return {
    reservationId: reservation.id,
    reservation_code: reservation.reservation_code,
    fullname: reservation.fullname,
    tel: reservation.tel,
    email: reservation.email,
    note: reservation.note,
    status: reservation.status,
    hold_expired_at: reservation.hold_expired_at,
  };
};

/**
 * Add or update pre-ordered items for a reservation
 * @param {number} reservationId - Reservation ID
 * @param {Array} items - Array of { product_id, quantity }
 * @returns {Promise<object>} Updated reservation with items and total_amount
 */

/**
 * Expire HOLD reservations that have passed their hold_expired_at time
 * @returns {Promise<object>} Number of expired reservations
 */
const expireHoldReservationsService = async () => {
  try {
    const now = new Date();

    // Find all HOLD reservations that have expired
    const expiredReservations = await Reservation.update(
      {
        status: 5, // EXPIRED
      },
      {
        where: {
          status: 0, // HOLD
          hold_expired_at: {
            [Op.lt]: now, // Less than current time
          },
        },
      },
    );

    const expiredCount = expiredReservations[0]; // Sequelize returns [affectedRows, affectedRows]

    return {
      expiredCount,
      timestamp: now,
    };
  } catch (error) {
    console.error("Error expiring hold reservations:", error);
    throw error;
  }
};

/**
 * Get reservation by ID with related details and products
 * READ-ONLY: does not modify reservation status or auto-expire
 * @param {number} reservationId - Reservation ID
 * @returns {Promise<import("sequelize").Model>} Reservation instance with associations
 */
const getReservationByIdService = async (reservationId) => {
  const reservation = await Reservation.findByPk(reservationId, {
    include: [
      {
        model: ReservationDetail,
        as: "reservation_details",
        include: [
          {
            model: Product,
            attributes: ["id", "name", "price", "sale_price"],
          },
        ],
      },
    ],
  });

  if (!reservation) {
    throw new Error("RESERVATION_NOT_FOUND");
  }

  return reservation;
};

/**
 * Get payment preview for a reservation (READ-ONLY)
 * @param {number} reservationId - Reservation ID
 * @returns {Promise<{ reservationId: number; total_amount: number }>}
 */
const getPaymentPreviewService = async (reservationId) => {
  const reservation = await Reservation.findByPk(reservationId, {
    attributes: ["id", "total_amount"],
  });

  if (!reservation) {
    throw new Error("RESERVATION_NOT_FOUND");
  }

  return {
    reservationId: reservation.id,
    total_amount: parseFloat(reservation.total_amount) || 0,
  };
};

/**
 * Manually cancel a reservation
 * Allowed statuses: HOLD (0), CONFIRMED (1)
 * Other statuses: throw error, no status change
 * @param {number} reservationId - Reservation ID
 * @returns {Promise<{ reservationId: number; status: number }>}
 */
const cancelReservationByIdService = async (reservationId) => {
  const reservation = await Reservation.findByPk(reservationId);

  if (!reservation) {
    throw new Error("RESERVATION_NOT_FOUND");
  }

  // Only allow cancel when status is HOLD (0) or CONFIRMED (1)
  if (reservation.status !== 0 && reservation.status !== 1) {
    throw new Error("RESERVATION_CANNOT_BE_CANCELED");
  }

  await reservation.update({
    status: 4, // CANCELED
  });

  return {
    reservationId: reservation.id,
    status: reservation.status,
  };
};

/**
 * Apply promotion to a reservation (validate + compute only, no DB update).
 * @param {number} reservationId
 * @param {{ code_name?: string, promotion_id?: number }} body
 * @returns {Promise<{ applied: boolean, promotion?, total_before, total_after, discount_amount, deposit_before, deposit_after }>}
 */
const applyPromotionService = async (reservationId, body) => {
  const { code_name, promotion_id } = body || {};
  if (!code_name && (promotion_id === undefined || promotion_id === null)) {
    const err = new Error("PROMOTION_REQUIRED");
    err.applied = false;
    err.message = "Cần truyền code_name hoặc promotion_id.";
    throw err;
  }

  const reservation = await Reservation.findByPk(reservationId, {
    attributes: ["id", "status", "total_amount"],
  });
  if (!reservation) {
    const err = new Error("RESERVATION_NOT_FOUND");
    err.applied = false;
    throw err;
  }
  if (reservation.status !== 0) {
    const err = new Error("RESERVATION_NOT_HOLD");
    err.applied = false;
    err.message =
      "Chỉ áp dụng mã khi đặt bàn đang ở trạng thái chờ thanh toán.";
    throw err;
  }

  let promotion = null;
  if (promotion_id) {
    promotion = await Promotion.findByPk(promotion_id, { raw: true });
  } else if (code_name) {
    promotion = await Promotion.findOne({
      where: { code_name: code_name.trim() },
      raw: true,
    });
  }
  if (!promotion) {
    const err = new Error("PROMOTION_INVALID");
    err.applied = false;
    err.message = "Mã không hợp lệ hoặc đã hết.";
    throw err;
  }

  const now = new Date();
  const validFrom = new Date(promotion.valid_from);
  const validTo = new Date(promotion.valid_to);
  if (now < validFrom || now > validTo) {
    const err = new Error("PROMOTION_INVALID");
    err.applied = false;
    err.message = "Mã không hợp lệ hoặc đã hết.";
    throw err;
  }
  const qty = parseInt(promotion.quantity, 10);
  if (!Number.isFinite(qty) || qty <= 0) {
    const err = new Error("PROMOTION_INVALID");
    err.applied = false;
    err.message = "Mã không hợp lệ hoặc đã hết.";
    throw err;
  }

  const totalBefore = parseFloat(reservation.total_amount) || 0;
  const discountType = parseInt(promotion.type, 10) === 1 ? "percent" : "fixed";
  const discountValue = parseFloat(promotion.discount) || 0;

  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = totalBefore * (discountValue / 100);
  } else {
    discountAmount = Math.min(discountValue, totalBefore);
  }
  discountAmount = Math.round(discountAmount);

  const totalAfter = Math.max(0, totalBefore - discountAmount);
  const depositBefore = Math.round(totalBefore * 0.3);
  const depositAfter = Math.round(totalAfter * 0.3);

  return {
    applied: true,
    promotion: {
      id: promotion.id,
      code_name: promotion.code_name,
      discount: discountValue,
      discount_type: discountType,
      type: promotion.type,
    },
    total_before: totalBefore,
    total_after: totalAfter,
    discount_amount: discountAmount,
    deposit_before: depositBefore,
    deposit_after: depositAfter,
  };
};

// Export all service functions
export {
  holdReservationService,
  updateCustomerInfoService,
  addOrUpdateReservationItemsService,
  expireHoldReservationsService,
  getReservationByIdService,
  getPaymentPreviewService,
  cancelReservationByIdService,
  applyPromotionService,
  getAvailableTablesService,
  createAdminWalkInReservationService,
  // Add other service functions as needed
};
const addOrUpdateReservationItemsService = async (reservationId, items) => {
  // Validate items array
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("ITEMS_REQUIRED");
  }

  // Validate each item
  for (const item of items) {
    if (
      !item.product_id ||
      item.quantity === undefined ||
      item.quantity === null
    ) {
      throw new Error("INVALID_ITEM_FORMAT");
    }
    if (parseInt(item.quantity, 10) <= 0) {
      throw new Error("INVALID_ITEM_QUANTITY");
    }
  }

  const transaction = await sequelize.transaction();

  try {
    // Find the reservation
    const reservation = await Reservation.findByPk(reservationId, {
      transaction,
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // Check if reservation is in HOLD or CONFIRMED status
    if (reservation.status !== 0 && reservation.status !== 1) {
      throw new Error("RESERVATION_NOT_ELIGIBLE_FOR_ITEMS");
    }

    // Extract product IDs and validate products exist
    const productIds = items.map((item) => parseInt(item.product_id, 10));
    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        status: 1, // Only allow active products (status = 1)
      },
      transaction,
    });

    // Check if all products exist and are active
    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new Error(`PRODUCTS_NOT_FOUND: ${missingIds.join(", ")}`);
    }

    // Create a map of product_id to product for quick lookup
    const productMap = {};
    products.forEach((product) => {
      productMap[product.id] = product;
    });

    // Delete existing reservation_details for this reservation
    await ReservationDetail.destroy({
      where: { reservation_id: reservationId },
      transaction,
    });

    // Prepare reservation_details data with current product prices
    // Use sale_price if available and > 0, otherwise use price
    const reservationDetails = items.map((item) => {
      const product = productMap[parseInt(item.product_id, 10)];
      const price =
        parseFloat(product.sale_price) > 0
          ? parseFloat(product.sale_price)
          : parseFloat(product.price);

      return {
        reservation_id: reservationId,
        product_id: parseInt(item.product_id, 10),
        quantity: parseInt(item.quantity, 10),
        price: price,
      };
    });

    // Create new reservation_details
    if (reservationDetails.length > 0) {
      await ReservationDetail.bulkCreate(reservationDetails, { transaction });
    }

    // Calculate total_amount: sum of (quantity * price) for all items
    const totalAmount = reservationDetails.reduce((sum, detail) => {
      return sum + detail.quantity * detail.price;
    }, 0);

    // Update reservation total_amount
    await reservation.update(
      {
        total_amount: parseFloat(totalAmount.toFixed(2)),
      },
      { transaction },
    );

    await transaction.commit();

    // Fetch updated reservation
    const updatedReservation = await Reservation.findByPk(reservationId);

    // Fetch reservation details with product information
    const fetchedDetails = await ReservationDetail.findAll({
      where: { reservation_id: reservationId },
      include: [
        {
          model: Product,
          attributes: ["id", "name", "price", "sale_price"],
        },
      ],
    });

    return {
      reservationId: updatedReservation.id,
      reservation_code: updatedReservation.reservation_code,
      total_amount: parseFloat(updatedReservation.total_amount),
      items: fetchedDetails,
    };
  } catch (error) {
    const dbPrice =
      parseFloat(product.sale_price) > 0
        ? parseFloat(product.sale_price)
        : parseFloat(product.price);

    // Nếu frontend gửi giá khác, validate hoặc cảnh báo
    if (item.price && Math.abs(item.price - dbPrice) > 0.01) {
      console.warn(
        `Price mismatch for product ${item.product_id}: FE=${item.price}, DB=${dbPrice}`,
      );
    }

    const price = dbPrice; // Luôn sử dụng giá DB
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get available tables for a specific date/time range
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} start - Start time in ISO 8601 format
 * @param {string} end - End time in ISO 8601 format
 * @param {number} partySize - Party size
 * @returns {Promise<Array>} Array of available tables
 */
const getAvailableTablesService = async (date, start, end, partySize) => {
  // Validate input
  if (!date || !start || !end) {
    throw new Error("MISSING_REQUIRED_FIELDS");
  }

  const startTime = new Date(start);
  const endTime = new Date(end);
  const party = parseInt(partySize, 10);

  // Validate dates
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error("INVALID_DATE_FORMAT");
  }

  // Validate start < end
  if (startTime >= endTime) {
    throw new Error("INVALID_TIME_RANGE");
  }

  // Validate party size
  if (isNaN(party) || party <= 0) {
    throw new Error("INVALID_PARTY_SIZE");
  }

  // Get all active tables
  const tables = await Table.findAll({
    where: {
      is_active: true,
    },
    order: [["capacity", "ASC"]],
    raw: true,
  });

  if (tables.length === 0) {
    return [];
  }

  // Check availability for each table
  const availableTables = [];

  for (const table of tables) {
    // Check if party_size fits
    if (table.capacity < party) {
      continue;
    }

    // Check for overlap within [startTime, endTime]
    const conflictingReservation = await Reservation.findOne({
      where: {
        table_id: table.id,
        status: { [Op.in]: [0, 1, 2] }, // HOLD, CONFIRMED, CHECKED_IN
        [Op.and]: [
          { start_time: { [Op.lt]: endTime } },
          { end_time: { [Op.gt]: startTime } },
        ],
      },
      attributes: ["id"],
      raw: true,
    });

    // If no conflict, table is available
    if (!conflictingReservation) {
      // Find next reservation after end time for this table
      const nextReservation = await Reservation.findOne({
        where: {
          table_id: table.id,
          status: { [Op.in]: [0, 1, 2] },
          start_time: { [Op.gte]: endTime },
        },
        attributes: ["start_time"],
        order: [["start_time", "ASC"]],
        raw: true,
      });

      availableTables.push({
        id: table.id,
        code: table.code,
        capacity: table.capacity,
        nextReservationTime: nextReservation
          ? nextReservation.start_time
          : null,
      });
    }
  }

  return availableTables;
};

/**
 * Create admin walk-in reservation (quick create)
 * @param {object} data - Reservation data
 * @returns {Promise<object>} Created reservation
 */
const createAdminWalkInReservationService = async (data) => {
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
  } = data;

  // Validate required fields
  if (
    !table_id ||
    !fullname ||
    !tel ||
    !party_size ||
    !start_time ||
    !end_time
  ) {
    throw new Error("MISSING_REQUIRED_FIELDS");
  }

  // Validate party_size
  const partySize = parseInt(party_size, 10);
  if (isNaN(partySize) || partySize <= 0) {
    throw new Error("INVALID_PARTY_SIZE");
  }

  // Parse times as Vietnam when no timezone (so "2026-03-07T02:27:00" stays March 7)
  const startDate = parseAsVietnamIfNeeded(start_time);
  const endDate = parseAsVietnamIfNeeded(end_time);

  // Validate times
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("INVALID_TIME_FORMAT");
  }

  if (startDate >= endDate) {
    throw new Error("INVALID_TIME_RANGE");
  }

  // Override admin values
  const walkInReservationType = 1; // WALK_IN
  const confirmedStatus = 1; // CONFIRMED
  const zeroDeposit = 0;

  // Validate table exists and is active
  const table = await Table.findByPk(table_id);
  if (!table) {
    throw new Error("TABLE_NOT_FOUND");
  }

  if (!table.is_active) {
    throw new Error("TABLE_INACTIVE");
  }

  // Check for conflicts
  const conflictingReservation = await Reservation.findOne({
    where: {
      table_id,
      status: { [Op.in]: [0, 1, 2] }, // HOLD, CONFIRMED, CHECKED_IN
      [Op.and]: [
        { start_time: { [Op.lt]: endDate } },
        { end_time: { [Op.gt]: startDate } },
      ],
    },
  });

  if (conflictingReservation) {
    throw new Error("TABLE_NOT_AVAILABLE");
  }

  // Generate unique reservation code
  let reservationCode = generateReservationCode();
  let codeExists = true;
  let attempts = 0;
  const maxAttempts = 10;

  while (codeExists && attempts < maxAttempts) {
    const existing = await Reservation.findOne({
      where: { reservation_code: reservationCode },
    });
    if (!existing) {
      codeExists = false;
    } else {
      reservationCode = generateReservationCode();
      attempts++;
    }
  }

  if (codeExists) {
    throw new Error("FAILED_TO_GENERATE_RESERVATION_CODE");
  }

  // Create reservation
  const reservation = await Reservation.create({
    reservation_code: reservationCode,
    user_id: null, // Walk-in, no user
    table_id,
    fullname,
    tel,
    email: email || null,
    party_size: partySize,
    start_time: startDate,
    end_time: endDate,
    note: note || null,
    hold_expired_at: null, // Not a HOLD reservation
    reservation_type: walkInReservationType,
    status: confirmedStatus,
    total_amount: 0,
    deposit: zeroDeposit,
  });

  return {
    id: reservation.id,
    reservation_code: reservation.reservation_code,
    table_id: reservation.table_id,
    fullname: reservation.fullname,
    tel: reservation.tel,
    email: reservation.email,
    party_size: reservation.party_size,
    start_time: toVietnamISOString(reservation.start_time),
    end_time: toVietnamISOString(reservation.end_time),
    status: reservation.status,
    reservation_type: reservation.reservation_type,
    deposit: reservation.deposit,
  };
};

const {
  sequelize,
  Reservation,
  ReservationDetail,
  Promotion,
  Table,
  Product,
  User,
  ReservationLog,
} = require("../models/index");
const { Op, fn, col, where, literal } = require("sequelize");
const paymentService = require("./payment.service");

// Safe rollback helper: only rollback if transaction not finished
const safeRollback = async (trx) => {
  try {
    if (trx && trx.finished !== "commit" && trx.finished !== "rollback") {
      await trx.rollback();
    }
  } catch (e) {
    console.error("Error during safeRollback:", e);
  }
};

/**
 * Timeline đặt bàn theo BÀN × THỜI GIAN: mỗi bàn kèm danh sách reservation trong ngày.
 * Phân trang theo bàn; reservations lọc theo date và (nếu có) party_size.
 */
const getTimelineService = async ({ date, party_size, page, limit }) => {
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  const tableWhere = { is_active: true };

  const totalCount = await Table.count({ where: tableWhere });

  const tables = await Table.findAll({
    where: tableWhere,
    attributes: ["id", "code", "capacity"],
    order: [["code", "ASC"]],
    limit: limitNumber,
    offset,
  });

  if (tables.length === 0) {
    return {
      tables: [],
      totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
    };
  }

  const tableIds = tables.map((t) => t.id);
  // Filter by date in Vietnam timezone so "March 7 02:27 VN" appears in timeline for 2026-03-07
  const startTimeVietnamDate = fn(
    "DATE",
    fn("CONVERT_TZ", col("start_time"), literal("'+00:00'"), literal("'+07:00'")),
  );
  const reservationWhere = {
    table_id: { [Op.in]: tableIds },
    [Op.and]: where(startTimeVietnamDate, date),
  };
  if (
    party_size != null &&
    party_size !== "" &&
    !Number.isNaN(Number(party_size))
  ) {
    reservationWhere.party_size = Number(party_size);
  }

  const reservations = await Reservation.findAll({
    where: reservationWhere,
    attributes: [
      "id",
      "reservation_code",
      "fullname",
      "tel",
      "party_size",
      "start_time",
      "end_time",
      "deposit",
      "status",
      "table_id",
    ],
    order: [["start_time", "ASC"]],
    raw: true,
  });

  const reservationsByTableId = {};
  tableIds.forEach((id) => {
    reservationsByTableId[id] = [];
  });
  reservations.forEach((r) => {
    const list = reservationsByTableId[r.table_id] || [];
    list.push({
      id: r.id,
      reservation_code: r.reservation_code,
      fullname: r.fullname,
      tel: r.tel,
      party_size: r.party_size,
      start_time: r.start_time,
      end_time: r.end_time,
      deposit: r.deposit != null ? Number(r.deposit) : 0,
      status: r.status,
    });
    reservationsByTableId[r.table_id] = list;
  });

  const tablesWithReservations = tables.map((t) => ({
    id: t.id,
    code: t.code,
    capacity: t.capacity,
    reservations: reservationsByTableId[t.id] || [],
  }));

  return {
    tables: tablesWithReservations,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNumber),
    currentPage: pageNumber,
  };
};
const changeDishesService = async (
  reservationId,
  dishesArray,
  totalPayable,
) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Update reservations
    const updated = await Reservation.update(
      {
        total_amount: totalPayable,
        number_change: 2,
      },
      {
        where: { id: reservationId },
        transaction,
      },
    );

    if (updated[0] === 0) {
      throw new Error("Reservation not found");
    }

    // 2. Delete old reservation_details
    await ReservationDetail.destroy({
      where: { reservation_id: reservationId },
      transaction,
    });

    // 3. Insert new reservation_details
    const detailData = dishesArray.map((dish) => ({
      reservation_id: reservationId,
      product_id: dish.product_id,
      quantity: dish.quantity,
      price: dish.price,
    }));

    if (detailData.length > 0) {
      await ReservationDetail.bulkCreate(detailData, { transaction });
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await safeRollback(transaction);
    throw error; // ⚠️ THROW lỗi về controller
  }
};
const markReservationNotChangeService = async (reservationId) => {
  try {
    const [affectedRows] = await Reservation.update(
      { number_change: 2 },
      { where: { id: reservationId } },
    );

    if (affectedRows === 0) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    return true;
  } catch (error) {
    throw error;
  }
};
const addTableToReservationService = async (reservationID) => {
  try {
    // 1. Lấy reservation
    const reservation = await Reservation.findByPk(reservationID);

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    const partySize = reservation.party_size;

    // 2. Lấy các bàn phù hợp capacity (GIỮ NGUYÊN LOGIC CŨ)
    const tables = await Table.findAll({
      where: {
        [Op.or]: [{ capacity: 2, [Op.and]: where(fn("?", partySize), 1) }],
      },
    });

    // ⚠️ Sequelize không support trực tiếp kiểu WHERE ? = 1
    // → Ta giữ NGUYÊN NGHIỆP VỤ bằng JS filtering
    const suitableTables = await Table.findAll({
      where: {
        capacity: {
          [Op.in]:
            partySize <= 2
              ? [2]
              : partySize <= 4
                ? [4]
                : partySize <= 6
                  ? [6]
                  : [8],
        },
      },
    });

    let suitableTableId = null;

    // 3. Kiểm tra từng bàn (dùng start_time vì model dùng start_time/end_time)
    const reservationDate = reservation.reservation_date || reservation.start_time;
    for (const table of suitableTables) {
      const reservations = await Reservation.findAll({
        where: {
          table_id: table.id,
          [Op.and]: where(
            fn("DATE", col("start_time")),
            fn("DATE", reservationDate),
          ),
        },
      });

      const invalidStatuses = [3, 4];
      const hasInvalid = reservations.some((r) =>
        invalidStatuses.includes(r.status),
      );

      if (!hasInvalid) {
        suitableTableId = table.id;
        break;
      }
    }

    if (!suitableTableId) {
      throw new Error("NO_SUITABLE_TABLE");
    }

    // 4. Update reservation
    await Reservation.update(
      { table_id: suitableTableId },
      { where: { id: reservationID } },
    );

    return suitableTableId;
  } catch (error) {
    throw error;
  }
};
/**
 * List reservations for admin management page.
 * Filters: date (Vietnam), time_from/time_to, table_id, status, quick_view, searchName, searchPhone.
 * Quick views: upcoming (CONFIRMED, start_time > now), no_deposit (HOLD or CONFIRMED deposit=0),
 * not_checked_in (CONFIRMED), eating (CHECKED_IN).
 * Order: start_time ASC (nearest first).
 */
const getReservationListService = async (filters) => {
  const {
    date,
    time_from,
    time_to,
    table_id,
    status,
    quick_view,
    searchName = "",
    searchPhone = "",
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;
  const whereConditions = [];

  if (searchName && String(searchName).trim()) {
    whereConditions.push({ fullname: { [Op.like]: `%${String(searchName).trim()}%` } });
  }
  if (searchPhone && String(searchPhone).trim()) {
    whereConditions.push({ tel: { [Op.like]: `%${String(searchPhone).trim()}%` } });
  }
  if (table_id != null && table_id !== "" && !Number.isNaN(Number(table_id))) {
    whereConditions.push({ table_id: Number(table_id) });
  }

  if (date && String(date).trim()) {
    const startTimeVn = fn(
      "DATE",
      fn("CONVERT_TZ", col("start_time"), literal("'+00:00'"), literal("'+07:00'")),
    );
    whereConditions.push(where(startTimeVn, String(date).trim()));
    if (time_from && String(time_from).trim()) {
      const timePart = fn("TIME", fn("CONVERT_TZ", col("start_time"), literal("'+00:00'"), literal("'+07:00'")));
      whereConditions.push(sequelize.where(timePart, { [Op.gte]: String(time_from).trim() }));
    }
    if (time_to && String(time_to).trim()) {
      const timePart = fn("TIME", fn("CONVERT_TZ", col("start_time"), literal("'+00:00'"), literal("'+07:00'")));
      whereConditions.push(sequelize.where(timePart, { [Op.lte]: String(time_to).trim() }));
    }
  }

  if (status != null && status !== "") {
    const statusList = String(status)
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    if (statusList.length > 0) {
      whereConditions.push({ status: { [Op.in]: statusList } });
    }
  }

  if (quick_view && String(quick_view).trim()) {
    const qv = String(quick_view).trim().toLowerCase();
    const now = new Date();
    if (qv === "upcoming") {
      whereConditions.push({ status: 1 });
      whereConditions.push({ start_time: { [Op.gt]: now } });
    } else if (qv === "no_deposit") {
      whereConditions.push({
        [Op.or]: [
          { status: 0 },
          { [Op.and]: [{ status: 1 }, { [Op.or]: [{ deposit: 0 }, { deposit: null }] }] },
        ],
      });
    } else if (qv === "not_checked_in") {
      whereConditions.push({ status: 1 });
    } else if (qv === "eating") {
      whereConditions.push({ status: 2 });
    }
  }

  const whereClause = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

  const totalCount = await Reservation.count({ where: whereClause });

  const reservations = await Reservation.findAll({
    where: whereClause,
    include: [
      {
        model: Table,
        as: "table",
        attributes: ["id", ["code", "table_code"]],
        required: false,
      },
    ],
    attributes: [
      "id",
      "reservation_code",
      "fullname",
      "tel",
      "email",
      "party_size",
      "start_time",
      "end_time",
      "status",
      "deposit",
      "payment_method",
      "total_amount",
      "table_id",
      "reservation_type",
    ],
    order: [
      [col("start_time"), "ASC"],
      ["id", "ASC"],
    ],
    limit: Math.min(Math.max(1, parseInt(limit, 10) || 20), 100),
    offset,
    raw: false,
  });

  const rows = reservations.map((r) => {
    const plain = r.get ? r.get({ plain: true }) : r;
    const table = plain.table;
    return {
      id: plain.id,
      reservation_code: plain.reservation_code,
      start_time: plain.start_time,
      end_time: plain.end_time,
      table_id: plain.table_id,
      table_code: table ? table.table_code : null,
      fullname: plain.fullname,
      tel: plain.tel,
      email: plain.email,
      party_size: plain.party_size,
      status: plain.status,
      deposit: plain.deposit != null ? parseFloat(plain.deposit) : 0,
      payment_method: plain.payment_method || null,
      total_amount: plain.total_amount != null ? parseFloat(plain.total_amount) : 0,
      reservation_type: plain.reservation_type,
    };
  });

  return {
    totalCount,
    results: rows,
    totalPages: Math.ceil(totalCount / Math.min(Math.max(1, parseInt(limit, 10) || 20), 100)),
    currentPage: parseInt(page, 10) || 1,
    limit: Math.min(Math.max(1, parseInt(limit, 10) || 20), 100),
  };
};

//getAllReservationsService
const getAllReservationsService = async (filters) => {
  const {
    searchName,
    searchPhone,
    searchEmail,
    status,
    reservation_code,
    page,
    limit,
  } = filters;

  const offset = (page - 1) * limit;

  const transaction = await sequelize.transaction();

  try {
    const whereCondition = {
      fullname: { [Op.like]: `%${searchName}%` },
      tel: { [Op.like]: `%${searchPhone}%` },
      email: { [Op.like]: `%${searchEmail}%` },
      status: { [Op.like]: `%${status}%` },
      reservation_code: { [Op.like]: `%${reservation_code}%` },
    };

    const totalCount = await Reservation.count({
      where: whereCondition,
      transaction,
    });

    const reservations = await Reservation.findAll({
      where: whereCondition,
      include: [
        {
          model: Table,
          as: "table",
          attributes: [["code", "tableName"]],
        },
        {
          model: Promotion,
          as: "promotion",
          attributes: ["discount"],
        },
      ],
      order: [["id", "DESC"]],
      limit,
      offset,
      transaction,
    });

    await transaction.commit();

    return {
      totalCount,
      reservations,
    };
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};
const getMyBookingsService = async (userId, query) => {
  try {
    const {
      searchName = "",
      searchPhone = "",
      searchEmail = "",
      status = "",
      page = 1,
      pageSize = 10,
    } = query;

    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const size = parseInt(pageSize, 10) > 0 ? parseInt(pageSize, 10) : 10;
    const offset = (pageNumber - 1) * size;

    const whereCondition = {
      user_id: userId,
      fullname: { [Op.like]: `%${searchName}%` },
      tel: { [Op.like]: `%${searchPhone}%` },
      email: { [Op.like]: `%${searchEmail}%` },
      status: { [Op.like]: `%${status}%` },
    };

    const { count, rows } = await Reservation.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Table,
          as: "table",
          attributes: [["code", "tableName"]],
          required: false,
        },
        {
          model: Promotion,
          as: "promotion",
          attributes: ["discount"],
          required: false,
        },
      ],
      order: [["id", "DESC"]],
      limit: size,
      offset,
    });

    return {
      results: rows,
      totalCount: count,
      totalPages: Math.ceil(count / size),
      currentPage: pageNumber,
    };
  } catch (error) {
    throw error;
  }
};
const getReservationByIdService = async (id) => {
  try {
    const reservation = await Reservation.findOne({
      where: { id },
      include: [
        {
          model: Table,
          as: "table",
          attributes: [["code", "tableName"]],
          required: false,
        },
        {
          model: Promotion,
          as: "promotion",
          attributes: [["discount", "discount"]],
          required: false,
        },
      ],
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    return reservation;
  } catch (error) {
    throw error;
  }
};
const getReservationDetailsByReservationIdService = async (reservationId) => {
  try {
    const details = await ReservationDetail.findAll({
      where: { reservation_id: reservationId },
      include: [
        {
          model: Product,
          attributes: [
            ["name", "product_name"],
            ["image", "product_image"],
          ],
        },
      ],
    });

    return details;
  } catch (error) {
    throw error;
  }
};
const upsertProducts = async (reservationId, products, transaction) => {
  const existingProducts = await ReservationDetail.findAll({
    where: { reservation_id: reservationId },
    transaction,
  });

  const map = {};
  existingProducts.forEach((p) => {
    map[p.product_id] = p;
  });

  for (const product of products) {
    const { product_id, quantity, price } = product;

    if (!product_id || quantity == null || price == null) {
      throw new Error("Thiếu dữ liệu sản phẩm");
    }

    if (map[product_id]) {
      await map[product_id].update(
        { quantity: map[product_id].quantity + quantity },
        { transaction },
      );
    } else {
      await ReservationDetail.create(
        {
          reservation_id: reservationId,
          product_id,
          quantity,
          price,
        },
        { transaction },
      );
    }
  }
};

const updateReservation = async (reservationId, data) => {
  const transaction = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(reservationId, {
      transaction,
    });
    if (!reservation) throw new Error("Không tìm thấy đặt chỗ");

    await reservation.update(data, { transaction });

    if (Array.isArray(data.products) && data.products.length > 0) {
      await upsertProducts(reservationId, data.products, transaction);
    }

    const tableStatus = [3, 4].includes(data.status) ? 0 : 1;

    await Table.update(
      { status: tableStatus },
      { where: { id: reservation.table_id }, transaction },
    );

    await transaction.commit();
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};
const patchReservationStatus = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(id, { transaction });
    if (!reservation) {
      throw new Error("Reservations not found");
    }

    // Update reservation (partial)
    await reservation.update(updates, { transaction });

    // Nếu có status thì xử lý trạng thái bàn
    if (updates.status === 3) {
      if (!reservation.table_id) {
        throw new Error("Table ID not found");
      }

      await Table.update(
        { status: 0 },
        { where: { id: reservation.table_id }, transaction },
      );
    }

    // Các status khác
    if ([0, 1, 2, 5].includes(updates.status)) {
      if (!reservation.table_id) {
        throw new Error("Table not found for the reservation");
      }

      await Table.update(
        { status: 1 },
        { where: { id: reservation.table_id }, transaction },
      );
    }

    await transaction.commit();
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};
const deleteProductFromReservation = async (reservationId, productId) => {
  const deletedCount = await ReservationDetail.destroy({
    where: {
      reservation_id: reservationId,
      product_id: productId,
    },
  });

  if (deletedCount === 0) {
    throw new Error("Product not found in the reservation");
  }
};
const getExistingReservationCodes = async () => {
  const reservations = await Reservation.findAll({
    attributes: ["reservation_code"],
  });

  return reservations.map((item) => item.reservation_code);
};
/**
 * Tìm bàn trống phù hợp
 */
const findAvailableTable = async (reservationDate, partySize, transaction) => {
  const table = await Table.findOne({
    where: {
      capacity: { [Op.gte]: partySize },
        id: {
        [Op.notIn]: sequelize.literal(`
          (
            SELECT table_id
            FROM reservations
            WHERE DATE(start_time) = DATE('${reservationDate}')
              AND status IN (3, 4)
          )
        `),
      },
    },
    order: [["capacity", "ASC"]],
    transaction,
  });

  if (!table) {
    throw new Error("NO_AVAILABLE_TABLE");
  }

  return table.id;
};

/**
 * Tạo reservation + products
 */
const createReservation = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      reservation_code,
      fullname,
      email,
      tel,
      reservation_date,
      status,
      partySize,
      notes,
      totalAmount,
      deposit = 0,
      products = [],
    } = data;

    const tableId = await findAvailableTable(
      reservation_date,
      partySize,
      transaction,
    );

    if (!tableId) {
      throw new Error("Không có bàn trống");
    }

    const reservation = await Reservation.create(
      {
        reservation_code,
        fullname,
        email,
        tel,
        reservation_date,
        status,
        deposit,
        party_size: partySize,
        note: notes,
        total_amount: totalAmount,
        table_id: tableId,
      },
      { transaction },
    );

    if (products.length > 0) {
      const details = products.map((p) => ({
        reservation_id: reservation.id,
        product_id: p.product_id,
        quantity: p.quantity,
        price: p.price,
      }));

      await ReservationDetail.bulkCreate(details, { transaction });
    }

    await transaction.commit();
    return reservation.id;
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};
const filterTablesByDate = async ({ date, page, pageSize }) => {
  try {
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 8;
    const offset = (pageNumber - 1) * size;

    // Đếm tổng số bàn
    const countSql = `
      SELECT COUNT(*) AS total
      FROM tables t
      LEFT JOIN reservations r 
        ON t.id = r.table_id 
        AND DATE(r.start_time) = :date
      WHERE t.status IN (0,1)
    `;

    const [[countResult]] = await sequelize.query(countSql, {
      replacements: { date },
    });

    const totalCount = countResult.total;
    const totalPages = Math.ceil(totalCount / size);

    // Lấy danh sách bàn
    const dataSql = `
      SELECT 
        t.id,
        t.code,
        t.capacity,
        CASE 
          WHEN r.table_id IS NOT NULL THEN 0
          ELSE 1
        END AS status,
        r.start_time AS reservation_date
      FROM tables t
      LEFT JOIN reservations r 
        ON t.id = r.table_id 
        AND DATE(r.start_time) = :date
      WHERE t.status IN (0,1)
      ORDER BY t.code ASC
      LIMIT :limit OFFSET :offset
    `;

    const [results] = await sequelize.query(dataSql, {
      replacements: {
        date,
        limit: size,
        offset,
      },
    });

    return {
      results,
      totalCount,
      totalPages,
      currentPage: pageNumber,
    };
  } catch (error) {
    throw error;
  }
};
/**
 * API 1️⃣ GET DETAIL - Lấy chi tiết reservation kèm tính toán
 * GET /reservations_t_admin/:id
 * Include: User, Table, Promotion, ReservationDetails (include Product)
 * Returns: subtotal, deposit_required, is_hold_expired, remaining_hold_seconds
 */
const getReservationDetailService = async (reservationId) => {
  try {
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullname", "email", "tel"],
        },
        {
          model: Table,
          as: "table",
          attributes: ["id", "code", "capacity"],
        },
        {
          model: Promotion,
          as: "promotion",
          attributes: ["id", "code_name", "discount"],
        },
        {
          model: ReservationDetail,
          as: "reservation_details",
          attributes: ["id", "product_id", "quantity", "price"],
          include: [
            {
              model: Product,
              attributes: ["id", "name", "product_code", "price", "image"],
            },
          ],
        },
      ],
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // 🧮 Tính toán subtotal (sum của quantity * price từ reservation_details)
    let subtotal = 0;
    if (
      reservation.reservation_details &&
      reservation.reservation_details.length > 0
    ) {
      subtotal = reservation.reservation_details.reduce((sum, detail) => {
        return sum + detail.quantity * parseFloat(detail.price);
      }, 0);
    }

    // 🧮 Tính deposit_required (30% subtotal)
    const depositRequired = subtotal * 0.3;

    // 🧮 Kiểm tra is_hold_expired
    const now = new Date();
    const holdExpiredAt = reservation.hold_expired_at
      ? new Date(reservation.hold_expired_at)
      : null;
    const isHoldExpired = holdExpiredAt && now > holdExpiredAt;

    // 🧮 Tính remaining_hold_seconds
    let remainingHoldSeconds = 0;
    if (holdExpiredAt && !isHoldExpired) {
      remainingHoldSeconds = Math.floor(
        (holdExpiredAt.getTime() - now.getTime()) / 1000,
      );
    }

    return {
      id: reservation.id,
      reservation_code: reservation.reservation_code,
      user: reservation.user,
      table: reservation.table,
      promotion: reservation.promotion,
      fullname: reservation.fullname,
      tel: reservation.tel,
      email: reservation.email,
      party_size: reservation.party_size,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      status: reservation.status,
      deposit: parseFloat(reservation.deposit),
      reservation_type: reservation.reservation_type,
      note: reservation.note,
      reservation_details: reservation.reservation_details,
      // 💰 Thêm các trường tính toán
      subtotal: parseFloat(subtotal.toFixed(2)),
      deposit_required: parseFloat(depositRequired.toFixed(2)),
      is_hold_expired: isHoldExpired,
      remaining_hold_seconds: remainingHoldSeconds,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * API 2️⃣ THANH TOÁN CỌC
 * POST /reservations_t_admin/:id/pay-deposit
 * Body: { method: "CASH" | "BANK" | "MOMO" | "ZALOPAY" }
 */
const payDepositService = async (reservationId, paymentMethod) => {
  const transaction = await sequelize.transaction();

  try {
    // 1️⃣ Kiểm tra reservation tồn tại
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      include: [
        {
          model: ReservationDetail,
          as: "reservation_details",
          attributes: ["quantity", "price"],
        },
      ],
      transaction,
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // 2️⃣ Kiểm tra status = 0 (HOLD)
    if (reservation.status !== 0) {
      throw new Error("INVALID_STATUS");
    }

    // 3️⃣ Kiểm tra hold_expired_at > hiện tại
    const currentTime = new Date();
    if (
      reservation.hold_expired_at &&
      currentTime > reservation.hold_expired_at
    ) {
      throw new Error("HOLD_EXPIRED");
    }

    // 4️⃣ Kiểm tra deposit = 0 (chưa thu)
    if (parseFloat(reservation.deposit) > 0) {
      throw new Error("DEPOSIT_ALREADY_PAID");
    }

    // 5️⃣ Tính subtotal từ reservation_details
    let subtotal = 0;
    if (
      reservation.reservation_details &&
      reservation.reservation_details.length > 0
    ) {
      subtotal = reservation.reservation_details.reduce((sum, detail) => {
        return sum + detail.quantity * parseFloat(detail.price);
      }, 0);
    }

    // 6️⃣ Tính deposit = subtotal * 0.3
    const depositAmount = subtotal * 0.3;

    // 7️⃣ Update reservation: status = 1 (CONFIRMED), deposit = depositAmount
    //    record payment date and method
    const now = new Date();
    const updatedReservation = await Reservation.update(
      {
        status: 1, // CONFIRMED
        deposit: parseFloat(depositAmount.toFixed(2)),
        paid_at: now,
        payment_method: paymentMethod,
      },
      {
        where: { id: reservationId },
        transaction,
        returning: true,
      },
    );

    // 8️⃣ Ghi log vào reservation_logs
    await ReservationLog.create(
      {
        reservation_id: reservationId,
        action: "PAY_DEPOSIT",
        old_status: 0, // HOLD
        new_status: 1, // CONFIRMED
        old_deposit: 0,
        new_deposit: parseFloat(depositAmount.toFixed(2)),
        payment_method: paymentMethod,
        notes: `Thanh toán cọc thành công với phương thức: ${paymentMethod}`,
      },
      { transaction },
    );

    await transaction.commit();

    // ✅ Trả về reservation mới nhất sau update
    const finalReservation = await Reservation.findOne({
      where: { id: reservationId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullname", "email", "tel"],
        },
        {
          model: Table,
          as: "table",
          attributes: ["id", "code", "capacity"],
        },
        {
          model: Promotion,
          as: "promotion",
          attributes: ["id", "code_name", "discount"],
        },
        {
          model: ReservationDetail,
          as: "reservation_details",
          attributes: ["id", "product_id", "quantity", "price"],
          include: [
            {
              model: Product,
              attributes: ["id", "name", "product_code", "price"],
            },
          ],
        },
      ],
    });

    return finalReservation;
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * API 3️⃣ UPDATE MÓN KHI HOLD
 * PUT /reservations_t_admin/:id/items/:detaiId
 * Chỉ cho phép nếu status = HOLD (0)
 */
const updateReservationItemService = async (
  reservationId,
  detailId,
  quantity,
  price,
) => {
  const transaction = await sequelize.transaction();

  try {
    // 1️⃣ Kiểm tra reservation tồn tại
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // 2️⃣ Kiểm tra status = 0 (HOLD)
    if (reservation.status !== 0) {
      throw new Error("CANNOT_MODIFY_ITEMS_NOT_ON_HOLD");
    }

    // 3️⃣ Kiểm tra detail tồn tại
    const detail = await ReservationDetail.findOne({
      where: {
        id: detailId,
        reservation_id: reservationId,
      },
      transaction,
    });

    if (!detail) {
      throw new Error("DETAIL_NOT_FOUND");
    }

    // 4️⃣ Update detail
    await detail.update(
      {
        quantity: quantity || detail.quantity,
        price: price || detail.price,
      },
      { transaction },
    );

    // 5️⃣ Ghi log
    await ReservationLog.create(
      {
        reservation_id: reservationId,
        action: "CHANGE_ITEMS",
        new_status: 0, // HOLD
        notes: `Cập nhật số lượng: ${detail.quantity} → ${quantity || detail.quantity}`,
      },
      { transaction },
    );

    await transaction.commit();

    return detail;
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * API 3️⃣ DELETE MÓN KHI HOLD
 * DELETE /reservations_t_admin/:id/:productId
 * Chỉ cho phép nếu status = HOLD (0)
 */
const deleteReservationItemService = async (reservationId, detailId) => {
  const transaction = await sequelize.transaction();

  try {
    // 1️⃣ Kiểm tra reservation tồn tại
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // 2️⃣ Kiểm tra status = 0 (HOLD)
    if (reservation.status !== 0) {
      throw new Error("CANNOT_MODIFY_ITEMS_NOT_ON_HOLD");
    }

    // 3️⃣ Kiểm tra detail tồn tại
    const detail = await ReservationDetail.findOne({
      where: {
        id: detailId,
        reservation_id: reservationId,
      },
      transaction,
    });

    if (!detail) {
      throw new Error("DETAIL_NOT_FOUND");
    }

    const productId = detail.product_id;

    // 4️⃣ Delete detail
    await detail.destroy({ transaction });

    // 5️⃣ Ghi log
    await ReservationLog.create(
      {
        reservation_id: reservationId,
        action: "DELETE_ITEM",
        new_status: 0, // HOLD
        notes: `Xoá sản phẩm khỏi đơn đặt bàn`,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      message: "Item deleted successfully",
      product_id: productId,
    };
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * API 3️⃣ ADD MÓN KHI HOLD
 * POST /reservations_t_admin/:id/items
 * Body: { product_id, quantity, price }
 * Chỉ cho phép nếu status = HOLD (0)
 */
const addReservationItemService = async (
  reservationId,
  productId,
  quantity,
  price,
) => {
  const transaction = await sequelize.transaction();

  try {
    // 1️⃣ Kiểm tra reservation tồn tại
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // 2️⃣ Kiểm tra status = 0 (HOLD)
    if (reservation.status !== 0) {
      throw new Error("CANNOT_MODIFY_ITEMS_NOT_ON_HOLD");
    }

    // 3️⃣ Kiểm tra product tồn tại
    const product = await Product.findOne({
      where: { id: productId },
      transaction,
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    // 4️⃣ Kiểm tra item đã tồn tại, nếu có thì update quantity
    const existingDetail = await ReservationDetail.findOne({
      where: {
        reservation_id: reservationId,
        product_id: productId,
      },
      transaction,
    });

    if (existingDetail) {
      await existingDetail.update(
        {
          quantity: existingDetail.quantity + quantity,
        },
        { transaction },
      );

      // 5️⃣ Ghi log
      await ReservationLog.create(
        {
          reservation_id: reservationId,
          action: "ADD_ITEM",
          new_status: 0, // HOLD
          notes: `Thêm ${quantity} sản phẩm`,
        },
        { transaction },
      );

      await transaction.commit();
      return existingDetail;
    }

    // 5️⃣ Nếu chưa tồn tại, tạo mới
    const newDetail = await ReservationDetail.create(
      {
        reservation_id: reservationId,
        product_id: productId,
        quantity,
        price: price || product.price,
      },
      { transaction },
    );

    // 6️⃣ Ghi log
    await ReservationLog.create(
      {
        reservation_id: reservationId,
        action: "ADD_ITEM",
        new_status: 0, // HOLD
        notes: `Thêm ${quantity} sản phẩm mới`,
      },
      { transaction },
    );

    await transaction.commit();

    return newDetail;
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * API 5️⃣ CRON JOB - Expire HOLD reservations
 * Update status = 5 (EXPIRED) nếu status = 0 AND hold_expired_at < now()
 */
const expireHoldReservationsService = async () => {
  const transaction = await sequelize.transaction();

  try {
    const now = new Date();

    // 1️⃣ Tìm tất cả reservations HOLD đã hết hạn
    const expiredReservations = await Reservation.findAll({
      where: {
        status: 0, // HOLD
        hold_expired_at: {
          [Op.lt]: now, // hold_expired_at < now
        },
      },
      transaction,
    });

    if (expiredReservations.length === 0) {
      return {
        message: "No expired hold reservations found",
        updatedCount: 0,
      };
    }

    // 2️⃣ Update status = 5 (EXPIRED)
    const updatedCount = await Reservation.update(
      {
        status: 5, // EXPIRED
      },
      {
        where: {
          status: 0,
          hold_expired_at: {
            [Op.lt]: now,
          },
        },
        transaction,
      },
    );

    // 3️⃣ Ghi log cho mỗi reservation
    for (const reservation of expiredReservations) {
      await ReservationLog.create(
        {
          reservation_id: reservation.id,
          action: "AUTO_EXPIRE",
          old_status: 0, // HOLD
          new_status: 5, // EXPIRED
          notes: `Tự động hết hạn HOLD vào lúc ${now.toISOString()}`,
        },
        { transaction },
      );
    }

    await transaction.commit();

    return {
      message: `Successfully expired ${updatedCount[0]} hold reservations`,
      updatedCount: updatedCount[0],
    };
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/* ------------------- CONFIRMED FLOW SERVICES ------------------- */

/** Allow check-in this many minutes before reservation start_time (e.g. 30 = can check-in from 15:00 for a 15:30 slot). */
const CHECKIN_GRACE_MINUTES = 30;

/**
 * Check-in reservation
 * - Must be status = 1 (CONFIRMED)
 * - now must be >= (start_time - CHECKIN_GRACE_MINUTES)
 */
const checkInService = async (reservationId) => {
  const transaction = await sequelize.transaction();
  try {
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
    });
    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }
    if (reservation.status !== 1) {
      throw new Error("INVALID_STATUS");
    }
    const now = new Date();
    const startTime = new Date(reservation.start_time);
    const earliestCheckIn = new Date(startTime.getTime() - CHECKIN_GRACE_MINUTES * 60 * 1000);
    if (now < earliestCheckIn) {
      throw new Error("TOO_EARLY_TO_CHECKIN");
    }

    await reservation.update(
      { status: 2, checked_in_at: now },
      { transaction },
    );

    await ReservationLog.create(
      {
        reservation_id: reservationId,
        action: "CHECK_IN",
        old_status: 1,
        new_status: 2,
        notes: `Check-in at ${now.toISOString()}`,
      },
      { transaction },
    );

    await transaction.commit();

    // return detailed reservation
    return await getReservationByIdService(reservationId);
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * Cancel a confirmed reservation with refund options
 */
const cancelReservationService = async (reservationId, refundType) => {
  const transaction = await sequelize.transaction();
  try {
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
    });

    if (!reservation) {
      await safeRollback(transaction);
      throw new Error("RESERVATION_NOT_FOUND");
    }
    if (reservation.status !== 1) {
      await safeRollback(transaction);
      throw new Error("INVALID_STATUS");
    }

    const valid = ["FULL", "HALF", "NONE"];
    if (!valid.includes(refundType)) {
      await safeRollback(transaction);
      throw new Error("INVALID_REFUND_TYPE");
    }

    const deposit = parseFloat(reservation.deposit || 0);
    let refundAmount = 0;
    if (refundType === "FULL") refundAmount = deposit;
    if (refundType === "HALF") refundAmount = deposit * 0.5;

    const now = new Date();

    await reservation.update(
      {
        status: 4, // CANCELED
        cancelled_at: now,
        refund_type: refundType,
        refund_amount: refundAmount,
        refund_status: "PENDING",
      },
      { transaction },
    );

    await ReservationLog.create(
      {
        reservation_id: reservationId,
        action: "CANCEL",
        old_status: 1,
        new_status: 4,
        notes: `Cancel with refund=${refundType} amount=${refundAmount}`,
      },
      { transaction },
    );

    await transaction.commit();
    const updated = await getReservationByIdService(reservationId);
    return { refund_amount: refundAmount, reservation: updated };
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * Change table for a confirmed reservation
 */
const changeTableService = async (reservationId, newTableId) => {
  const transaction = await sequelize.transaction();
  try {
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
    });
    if (!reservation) {
      await safeRollback(transaction);
      throw new Error("RESERVATION_NOT_FOUND");
    }
    if (reservation.status !== 1) {
      await safeRollback(transaction);
      throw new Error("INVALID_STATUS");
    }

    const table = await Table.findOne({
      where: { id: newTableId },
      transaction,
    });
    if (!table) {
      await safeRollback(transaction);
      throw new Error("TABLE_NOT_FOUND");
    }
    if (table.capacity < reservation.party_size) {
      await safeRollback(transaction);
      throw new Error("TABLE_TOO_SMALL");
    }

    // check availability: no overlapping reservations (confirmed or checked-in)
    const conflicts = await Reservation.count({
      where: {
        table_id: newTableId,
        status: { [Op.in]: [1, 2] },
        id: { [Op.ne]: reservationId },
        start_time: { [Op.lt]: reservation.end_time },
        end_time: { [Op.gt]: reservation.start_time },
      },
      transaction,
    });
    if (conflicts > 0) {
      await safeRollback(transaction);
      throw new Error("TABLE_NOT_AVAILABLE");
    }

    const oldTableId = reservation.table_id;
    const now = new Date();
    await reservation.update(
      { table_id: newTableId, table_changed_at: now },
      { transaction },
    );

    await ReservationLog.create(
      {
        reservation_id: reservationId,
        action: "CHANGE_TABLE",
        old_status: reservation.status,
        new_status: reservation.status,
        notes: `Table changed from ${oldTableId} to ${newTableId}`,
      },
      { transaction },
    );

    await transaction.commit();
    // reuse existing helper to fetch full reservation detail
    const finalReservation = await getReservationByIdService(reservationId);
    return {
      old_table_id: oldTableId,
      new_table_id: newTableId,
      reservation: finalReservation,
    };
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * Get available tables for a given time slot and party size
 */
const getAvailableTablesService = async ({
  start_time,
  end_time,
  party_size,
}) => {
  try {
    if (!start_time || !end_time || !party_size) {
      throw new Error("MISSING_PARAMETERS");
    }
    const start = new Date(start_time);
    const end = new Date(end_time);

    // base query: capacity >= party_size and is_active
    const tables = await Table.findAll({
      where: {
        capacity: { [Op.gte]: party_size },
        is_active: true,
      },
    });

    const available = [];
    for (const t of tables) {
      const conflict = await Reservation.count({
        where: {
          table_id: t.id,
          status: { [Op.in]: [1, 2] },
          start_time: { [Op.lt]: end },
          end_time: { [Op.gt]: start },
        },
      });
      if (conflict === 0) {
        available.push({
          id: t.id,
          name: t.code,
          capacity: t.capacity,
          location: t.location || null,
          status: "available",
        });
      }
    }

    return { results: available };
  } catch (error) {
    throw error;
  }
};

/* ------------------- CHECKED_IN (POS) WORKFLOW SERVICES ------------------- */

/**
 * Add items to a reservation that is either CONFIRMED or CHECKED_IN
 * POST /reservations_t_admin/:id/add-item
 * Body: { items: [{ product_id, quantity, price }, ...] }
 */
const addCheckedInItemService = async (reservationId, items) => {
  const transaction = await sequelize.transaction();
  try {
    // 1️⃣ Validate reservation
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
    });
    if (!reservation) {
      await safeRollback(transaction);
      throw new Error("RESERVATION_NOT_FOUND");
    }
    // allow both CONFIRMED (1) and CHECKED_IN (2)
    if (![1, 2].includes(reservation.status)) {
      await safeRollback(transaction);
      throw new Error("INVALID_STATUS_MUST_BE_CONFIRMED_OR_CHECKED_IN");
    }

    // 2️⃣ Add or update items
    if (!Array.isArray(items) || items.length === 0) {
      await safeRollback(transaction);
      throw new Error("ITEMS_REQUIRED");
    }

    let subtotal = 0;
    for (const item of items) {
      const { product_id, quantity, price } = item;

      if (!quantity || quantity <= 0) {
        await safeRollback(transaction);
        throw new Error("INVALID_QUANTITY");
      }

      // If product_id is null, it's a custom dish - skip validation
      if (product_id !== null && product_id !== undefined) {
        const product = await Product.findOne({
          where: { id: product_id },
          transaction,
        });
        if (!product) {
          await safeRollback(transaction);
          throw new Error("PRODUCT_NOT_FOUND");
        }
      }

      const itemPrice =
        price ||
        (product_id
          ? (await Product.findOne({ where: { id: product_id }, transaction }))
              ?.price
          : 0);
      const itemTotal = quantity * (itemPrice || 0);
      subtotal += itemTotal;

      // Upsert: check if product already in ReservationDetail
      const existingDetail = await ReservationDetail.findOne({
        where: { reservation_id: reservationId, product_id },
        transaction,
      });

      if (existingDetail) {
        await existingDetail.update(
          {
            quantity: existingDetail.quantity + quantity,
            price: itemPrice || existingDetail.price,
          },
          { transaction },
        );
      } else {
        await ReservationDetail.create(
          {
            reservation_id: reservationId,
            product_id,
            quantity,
            price: itemPrice || 0,
          },
          { transaction },
        );
      }
    }

    // 3️⃣ Recalculate total_amount (subtotal only)
    const details = await ReservationDetail.findAll({
      where: { reservation_id: reservationId },
      transaction,
    });
    const newTotal = details.reduce((sum, d) => sum + d.quantity * d.price, 0);

    await reservation.update({ total_amount: newTotal }, { transaction });

    await transaction.commit();

    const updated = await Reservation.findOne({
      where: { id: reservationId },
      include: [{ model: ReservationDetail, as: "reservation_details" }],
    });

    return {
      success: true,
      data: updated,
      message: "Thêm món thành công",
    };
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * Update item in a CONFIRMED or CHECKED_IN reservation
 * PUT /reservations_t_admin/:id/update-item
 * Body: { product_id, quantity, price }
 */
const updateCheckedInItemService = async (
  reservationId,
  { product_id, quantity, price },
) => {
  const transaction = await sequelize.transaction();
  try {
    // 1️⃣ Validate reservation
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
    });
    if (!reservation) {
      await safeRollback(transaction);
      throw new Error("RESERVATION_NOT_FOUND");
    }
    // allow both CONFIRMED (1) and CHECKED_IN (2)
    if (![1, 2].includes(reservation.status)) {
      await safeRollback(transaction);
      throw new Error("INVALID_STATUS_MUST_BE_CONFIRMED_OR_CHECKED_IN");
    }

    // 2️⃣ Validate product_id and update
    if (product_id === null || product_id === undefined) {
      await safeRollback(transaction);
      throw new Error("PRODUCT_ID_REQUIRED");
    }

    const detail = await ReservationDetail.findOne({
      where: { reservation_id: reservationId, product_id },
      transaction,
    });
    if (!detail) {
      await safeRollback(transaction);
      throw new Error("DETAIL_NOT_FOUND");
    }

    if (!quantity || quantity <= 0) {
      await safeRollback(transaction);
      throw new Error("INVALID_QUANTITY");
    }

    await detail.update(
      {
        quantity,
        price: price || detail.price,
      },
      { transaction },
    );

    // 3️⃣ Recalculate total
    const details = await ReservationDetail.findAll({
      where: { reservation_id: reservationId },
      transaction,
    });
    const newTotal = details.reduce((sum, d) => sum + d.quantity * d.price, 0);

    await reservation.update({ total_amount: newTotal }, { transaction });

    await transaction.commit();

    return detail;
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * Remove item from a CONFIRMED or CHECKED_IN reservation
 * DELETE /reservations_t_admin/:id/remove-item?product_id=5
 */
const removeCheckedInItemService = async (reservationId, productId) => {
  const transaction = await sequelize.transaction();
  try {
    // 1️⃣ Validate reservation
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
    });
    if (!reservation) {
      await safeRollback(transaction);
      throw new Error("RESERVATION_NOT_FOUND");
    }
    // allow both CONFIRMED (1) and CHECKED_IN (2)
    if (![1, 2].includes(reservation.status)) {
      await safeRollback(transaction);
      throw new Error("INVALID_STATUS_MUST_BE_CONFIRMED_OR_CHECKED_IN");
    }

    // 2️⃣ Find and delete item
    const detail = await ReservationDetail.findOne({
      where: { reservation_id: reservationId, product_id: productId },
      transaction,
    });
    if (!detail) {
      await safeRollback(transaction);
      throw new Error("DETAIL_NOT_FOUND");
    }

    await detail.destroy({ transaction });

    // 3️⃣ Recalculate total
    const details = await ReservationDetail.findAll({
      where: { reservation_id: reservationId },
      transaction,
    });
    const newTotal = details.reduce((sum, d) => sum + d.quantity * d.price, 0);

    await reservation.update({ total_amount: newTotal }, { transaction });

    await transaction.commit();

    return {
      success: true,
      data: reservation,
      message: "Xoá món thành công",
    };
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

/**
 * Helper: compute discount amount from promotion (type 0 = percent, type 1 = fixed VND).
 * @param {number} subtotal
 * @param {{ type: number, discount: number }} promo
 * @returns {number}
 */
const getPromotionDiscountAmount = (subtotal, promo) => {
  const type = parseInt(promo.type, 10);
  const discount = parseFloat(promo.discount || 0);
  if (type === 0) return subtotal * (discount / 100);
  return Math.min(discount, subtotal);
};

/**
 * Preview bill for CHECKED_IN reservation
 * GET /reservations_t_admin/:id/preview-bill
 * Query (optional): voucher_code, special_promotion_id, point_used
 * NO database writes - ephemeral calculation. Applies discounts and returns finalAmount already reduced.
 */
const previewBillService = async (reservationId, options = {}) => {
  const {
    voucher_code = "",
    special_promotion_id,
    point_used = 0,
  } = options;

  try {
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      include: [
        { model: ReservationDetail, as: "reservation_details" },
        { model: Promotion, as: "promotion" },
      ],
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // 1️⃣ Calculate subtotal
    const subtotal = reservation.reservation_details.reduce(
      (sum, d) => sum + d.quantity * d.price,
      0,
    );

    // 2️⃣ Get membership tier discount
    let tierDiscount = 0;
    if (reservation.user_id) {
      const membershipCard = await sequelize.models.MembershipCard.findOne({
        where: { user_id: reservation.user_id },
        include: [{ model: sequelize.models.MembershipTier, as: "tier" }],
      });

      if (membershipCard && membershipCard.tier) {
        const discountRate = membershipCard.tier.discount_rate || 0;
        tierDiscount = subtotal * discountRate;
      }
    }

    // 3️⃣ Calculate tax (5%) and service (3%)
    const taxRate = 0.05;
    const serviceRate = 0.03;
    const tax = subtotal * taxRate;
    const service = subtotal * serviceRate;

    const deposit = parseFloat(reservation.deposit || 0);

    // 4️⃣ Voucher (regular) by code_name
    let voucherRegularDiscount = 0;
    if (voucher_code && String(voucher_code).trim()) {
      const now = new Date();
      const voucher = await sequelize.models.Promotion.findOne({
        where: {
          code_name: String(voucher_code).trim(),
          valid_from: { [Op.lte]: now },
          valid_to: { [Op.gte]: now },
          quantity: { [Op.gt]: 0 },
        },
      });
      if (!voucher) {
        throw new Error("PROMOTION_INVALID");
      }
      voucherRegularDiscount = getPromotionDiscountAmount(subtotal, voucher);
    }

    // 5️⃣ Special promotion by id
    let specialDiscount = 0;
    if (special_promotion_id != null && special_promotion_id !== "") {
      const specialPromo = await sequelize.models.Promotion.findOne({
        where: { id: special_promotion_id, type: 1 },
      });
      if (!specialPromo) {
        throw new Error("PROMOTION_INVALID");
      }
      const now = new Date();
      if (now < new Date(specialPromo.valid_from) || now > new Date(specialPromo.valid_to)) {
        throw new Error("PROMOTION_INVALID");
      }
      if (!specialPromo.quantity || specialPromo.quantity <= 0) {
        throw new Error("PROMOTION_INVALID");
      }
      specialDiscount = getPromotionDiscountAmount(subtotal, specialPromo);
    }

    // 6️⃣ Points (VND)
    const pointsDiscount = Math.max(0, parseFloat(point_used) || 0);

    // 7️⃣ Total discount with 50% cap
    let totalDiscount = tierDiscount + voucherRegularDiscount + specialDiscount + pointsDiscount;
    const maxDiscount = subtotal * 0.5;
    let voucherFinal = voucherRegularDiscount;
    let specialFinal = specialDiscount;
    let pointsFinal = pointsDiscount;
    if (totalDiscount > maxDiscount) {
      const ratio = maxDiscount / totalDiscount;
      tierDiscount *= ratio;
      voucherFinal = voucherRegularDiscount * ratio;
      specialFinal = specialDiscount * ratio;
      pointsFinal = pointsDiscount * ratio;
      totalDiscount = maxDiscount;
    }

    // 8️⃣ Final amount after all discounts
    const finalAmount = Math.max(0, subtotal + tax + service - totalDiscount);
    const previewRemaining = Math.max(0, finalAmount - deposit);

    // 9️⃣ Collect available special promotions for UI
    const specialPromotions = await sequelize.models.Promotion.findAll({
      where: {
        type: 1,
        valid_from: { [Op.lte]: new Date() },
        valid_to: { [Op.gte]: new Date() },
      },
      attributes: ["id", "code_name", "discount", "type"],
      limit: 10,
    });

    // 🔟 Breakdown for frontend (voucher_regular, special, points, final)
    const breakdown = {
      subtotal,
      tier_discount: tierDiscount,
      tax,
      service,
      voucher_regular: voucherFinal,
      special: specialFinal,
      points: pointsFinal,
      final: finalAmount,
      previewRemaining,
      finalAmount,
    };

    return {
      success: true,
      data: {
        reservation_id: reservationId,
        subtotal,
        tier_discount: tierDiscount,
        deposit,
        tax,
        service,
        previewRemaining,
        finalAmount,
        special_promotions: specialPromotions.map((p) => ({
          id: p.id,
          name: p.code_name,
          discount: p.discount,
          type: p.type,
        })),
        breakdown,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Complete CHECKED_IN reservation and finalize payment
 * POST /reservations_t_admin/:id/complete
 * Body: { voucher_code, special_promotion_id, point_used, payment_method, amount_received }
 */
const completeReservationService = async (
  reservationId,
  {
    voucher_code,
    special_promotion_id,
    point_used = 0,
    payment_method,
    amount_received,
  },
) => {
  const transaction = await sequelize.transaction();
  try {
    // 1️⃣ Validate reservation exists and is CHECKED_IN
    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      include: [
        { model: ReservationDetail, as: "reservation_details" },
        { model: Promotion, as: "promotion" },
      ],
      transaction,
    });

    if (!reservation) {
      await safeRollback(transaction);
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // If already completed, return idempotently
    if (reservation.status === 3) {
      await transaction.commit();
      return await getReservationByIdService(reservationId);
    }

    if (reservation.status !== 2) {
      await safeRollback(transaction);
      throw new Error("INVALID_STATUS_MUST_BE_CHECKED_IN");
    }

    if (!payment_method) {
      await safeRollback(transaction);
      throw new Error("PAYMENT_METHOD_REQUIRED");
    }

    // 2️⃣ Calculate subtotal
    const subtotal = reservation.reservation_details.reduce(
      (sum, d) => sum + d.quantity * d.price,
      0,
    );

    // 3️⃣ Calculate tier discount
    let tierDiscount = 0;
    if (reservation.user_id) {
      const membershipCard = await sequelize.models.MembershipCard.findOne({
        where: { user_id: reservation.user_id },
        include: [{ model: sequelize.models.MembershipTier, as: "tier" }],
        transaction,
      });

      if (membershipCard && membershipCard.tier) {
        const discountRate = membershipCard.tier.discount_rate || 0;
        tierDiscount = subtotal * discountRate;
      }
    }

    // 4️⃣ Apply voucher (regular) by code if provided
    let voucherRegularDiscount = 0;
    if (voucher_code && String(voucher_code).trim()) {
      const now = new Date();
      const voucher = await sequelize.models.Promotion.findOne({
        where: {
          code_name: String(voucher_code).trim(),
          valid_from: { [Op.lte]: now },
          valid_to: { [Op.gte]: now },
          quantity: { [Op.gt]: 0 },
        },
        transaction,
      });
      if (!voucher) {
        await safeRollback(transaction);
        throw new Error("PROMOTION_INVALID");
      }
      voucherRegularDiscount = getPromotionDiscountAmount(subtotal, voucher);
    }

    // 5️⃣ Apply special promotion if provided
    let specialPromoDiscount = 0;
    if (special_promotion_id != null && special_promotion_id !== "") {
      const specialPromo = await sequelize.models.Promotion.findOne({
        where: { id: special_promotion_id, type: 1 },
        transaction,
      });

      if (specialPromo) {
        specialPromoDiscount = getPromotionDiscountAmount(subtotal, specialPromo);
        const now = new Date();
        if (now < new Date(specialPromo.valid_from) || now > new Date(specialPromo.valid_to)) {
          await safeRollback(transaction);
          throw new Error("PROMOTION_INVALID");
        }
        if (!specialPromo.quantity || specialPromo.quantity <= 0) {
          await safeRollback(transaction);
          throw new Error("PROMOTION_INVALID");
        }
      }
    }

    // 6️⃣ Apply points discount (VND)
    let pointsDiscount = 0;
    if (point_used && point_used > 0) {
      pointsDiscount = point_used;
    }

    // 7️⃣ Calculate total discount (enforce 50% max)
    let totalDiscount =
      tierDiscount + voucherRegularDiscount + specialPromoDiscount + pointsDiscount;
    const maxDiscount = subtotal * 0.5;

    if (totalDiscount > maxDiscount) {
      const ratio = maxDiscount / totalDiscount;
      tierDiscount *= ratio;
      voucherRegularDiscount *= ratio;
      specialPromoDiscount *= ratio;
      pointsDiscount *= ratio;
      totalDiscount = maxDiscount;
    }

    // 8️⃣ Calculate tax and service
    const tax = subtotal * 0.05;
    const service = subtotal * 0.03;

    // 9️⃣ Calculate final amount
    const finalAmount = subtotal + tax + service - totalDiscount;
    const deposit = parseFloat(reservation.deposit || 0);
    const remainingDue = finalAmount - deposit;

    // 🔟 Validate payment
    const validMethods = ["cash", "bank", "momo", "zalopay"];
    if (!validMethods.includes(payment_method.toLowerCase())) {
      await safeRollback(transaction);
      throw new Error("INVALID_PAYMENT_METHOD");
    }

    if (payment_method.toLowerCase() === "cash") {
      const received = parseFloat(amount_received || 0);
      if (received < remainingDue) {
        await safeRollback(transaction);
        throw new Error("INSUFFICIENT_CASH");
      }
    }

    // MOMO: create payment order, return payUrl for redirect; completion happens in callback
    if (payment_method.toLowerCase() === "momo") {
      await transaction.commit();
      const { payUrl, orderId } = await paymentService.createCompletePayment({
        reservationId,
        amount: remainingDue,
        extraData: {
          finalAmount,
          point_used,
          special_promotion_id: special_promotion_id || null,
          totalDiscount,
        },
      });
      return {
        success: true,
        payUrl,
        orderId,
        requiresRedirect: true,
        message: "Chuyển hướng đến MOMO để thanh toán",
        payment_info: {
          subtotal,
          tier_discount: tierDiscount,
          voucher_regular_discount: voucherRegularDiscount,
          special_promotion_discount: specialPromoDiscount,
          points_discount: pointsDiscount,
          total_discount: totalDiscount,
          tax,
          service,
          final_amount: finalAmount,
          deposit,
          remaining_due: remainingDue,
          payment_method: "momo",
        },
      };
    }

    // 1️⃣1️⃣ Update reservation - finalize payment (cash, bank, zalopay)
    const now = new Date();
    await reservation.update(
      {
        status: 3, // COMPLETED
        completed_at: now,
        paid_at: now,
        total_amount: finalAmount,
        payment_method: payment_method.toLowerCase(),
      },
      { transaction },
    );

    // 1️⃣2️⃣ Update membership points if applicable
    if (reservation.user_id && point_used > 0) {
      const membershipCard = await sequelize.models.MembershipCard.findOne({
        where: { user_id: reservation.user_id },
        transaction,
      });

      if (membershipCard) {
        // Deduct points used
        const newPoints = Math.max(
          0,
          (membershipCard.point || 0) - Math.floor(point_used / 1000),
        );
        await membershipCard.update({ point: newPoints }, { transaction });
      }
    }

    // 1️⃣3️⃣ Create log entry
    await ReservationLog.create(
      {
        reservation_id: reservationId,
        action: "COMPLETE",
        old_status: 2,
        new_status: 3,
        notes: `Payment=${payment_method}, amount=${finalAmount}, discount=${totalDiscount}`,
      },
      { transaction },
    );

    await transaction.commit();

    // Return complete reservation detail
    const completed = await getReservationByIdService(reservationId);
    return {
      success: true,
      data: completed,
      message: "Thanh toán thành công",
      payment_info: {
        subtotal,
        tier_discount: tierDiscount,
        voucher_regular_discount: voucherRegularDiscount,
        special_promotion_discount: specialPromoDiscount,
        points_discount: pointsDiscount,
        total_discount: totalDiscount,
        tax,
        service,
        final_amount: finalAmount,
        deposit,
        remaining_due: remainingDue,
        amount_received: amount_received || finalAmount,
        change_amount: parseFloat(amount_received || 0) - remainingDue,
        payment_method,
      },
    };
  } catch (error) {
    await safeRollback(transaction);
    throw error;
  }
};

module.exports = {
  changeDishesService,
  getReservationListService,
  getAllReservationsService,
  markReservationNotChangeService,
  addTableToReservationService,
  getMyBookingsService,
  getReservationByIdService,
  getReservationDetailsByReservationIdService,
  updateReservation,
  patchReservationStatus,
  deleteProductFromReservation,
  getExistingReservationCodes,
  filterTablesByDate,
  createReservation,
  getTimelineService,
  // 🆕 HOLD Feature services
  getReservationDetailService,
  payDepositService,
  updateReservationItemService,
  deleteReservationItemService,
  addReservationItemService,
  expireHoldReservationsService,
  // 🆕 CONFIRMED flow
  checkInService,
  cancelReservationService,
  changeTableService,
  getAvailableTablesService,
  // 🆕 CHECKED_IN (POS) Workflow
  addCheckedInItemService,
  updateCheckedInItemService,
  removeCheckedInItemService,
  previewBillService,
  completeReservationService,
};

const {
  sequelize,
  Reservation,
  ReservationDetail,
  Promotion,
  ChangeDish,
  Table,
  Product,
} = require("../models/index");
const { Op, fn, col, where } = require("sequelize");
const changeDishesService = async (
  reservationId,
  dishesArray,
  totalPayable
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
      }
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
    await transaction.rollback();
    throw error; // ⚠️ THROW lỗi về controller
  }
};
const markReservationNotChangeService = async (reservationId) => {
  try {
    const [affectedRows] = await Reservation.update(
      { number_change: 2 },
      { where: { id: reservationId } }
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

    // 3. Kiểm tra từng bàn
    for (const table of suitableTables) {
      const reservations = await Reservation.findAll({
        where: {
          table_id: table.id,
          [Op.and]: where(
            fn("DATE", col("reservation_date")),
            fn("DATE", reservation.reservation_date)
          ),
        },
      });

      const invalidStatuses = [3, 4];
      const hasInvalid = reservations.some((r) =>
        invalidStatuses.includes(r.status)
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
      { where: { id: reservationID } }
    );

    return suitableTableId;
  } catch (error) {
    throw error;
  }
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
          attributes: [["number", "tableName"]],
        },
        {
          model: Promotion,
          attributes: ["discount"],
        },
        {
          model: ChangeDish,
          attributes: [
            "product_id",
            "quantity",
            "price",
            "total_amount",
            "productName",
            "productImage",
            "taxMoney",
            "reducedMoney",
          ],
          required: false,
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
    await transaction.rollback();
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
          attributes: [["number", "tableName"]],
          required: false,
        },
        {
          model: Promotion,
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
          attributes: [["number", "tableName"]],
          required: false,
        },
        {
          model: Promotion,
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
        { transaction }
      );
    } else {
      await ReservationDetail.create(
        {
          reservation_id: reservationId,
          product_id,
          quantity,
          price,
        },
        { transaction }
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
      { where: { id: reservation.table_id }, transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
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
        { where: { id: reservation.table_id }, transaction }
      );
    }

    // Các status khác
    if ([0, 1, 2, 5].includes(updates.status)) {
      if (!reservation.table_id) {
        throw new Error("Table not found for the reservation");
      }

      await Table.update(
        { status: 1 },
        { where: { id: reservation.table_id }, transaction }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
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
  const capacityMap = {
    1: 2,
    2: 2,
    3: 4,
    4: 4,
    5: 6,
    6: 6,
    7: 8,
    8: 8,
  };

  const capacity = capacityMap[partySize];
  if (!capacity) return null;

  const tables = await Table.findAll({
    where: { capacity },
    transaction,
  });

  for (const table of tables) {
    const conflict = await Reservation.findOne({
      where: {
        table_id: table.id,
        reservation_date: sequelize.where(
          sequelize.fn("DATE", sequelize.col("reservation_date")),
          sequelize.fn("DATE", reservationDate)
        ),
        status: { [Op.in]: [3, 4] },
      },
      transaction,
    });

    if (!conflict) return table.id;
  }

  return null;
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
      transaction
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
      { transaction }
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
    await transaction.rollback();
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
        AND DATE(r.reservation_date) = :date
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
        t.number,
        t.capacity,
        CASE 
          WHEN r.table_id IS NOT NULL THEN 0
          ELSE 1
        END AS status,
        r.reservation_date
      FROM tables t
      LEFT JOIN reservations r 
        ON t.id = r.table_id 
        AND DATE(r.reservation_date) = :date
      WHERE t.status IN (0,1)
      ORDER BY t.number ASC
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
module.exports = {
  changeDishesService,
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
};

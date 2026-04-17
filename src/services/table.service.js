import { Op, fn, col, literal } from "sequelize";
import { Table, Reservation, sequelize } from "../models/index.js";

/**
 * Lấy danh sách bàn (chỉ quản lý bàn, không liên quan đặt bàn).
 * Model Table: id, code, capacity, is_active.
 */
const getTablesService = async ({ search, searchCapacity, page, limit }) => {
  try {
    const offset = (page - 1) * limit;

    const whereCondition = {};
    if (search != null && String(search).trim() !== "") {
      whereCondition.code = { [Op.like]: `%${String(search).trim()}%` };
    }
    if (searchCapacity != null && String(searchCapacity).trim() !== "") {
      const cap = parseInt(searchCapacity, 10);
      if (!Number.isNaN(cap)) whereCondition.capacity = cap;
    }

    const { count, rows } = await Table.findAndCountAll({
      where: whereCondition,
      order: [["code", "ASC"]],
      limit,
      offset,
    });

    return {
      results: rows.map((table) => ({
        id: table.id,
        table_id: table.id,
        number: table.code,
        code: table.code,
        capacity: table.capacity,
        status: table.is_active ? 1 : 0,
        is_active: table.is_active,
      })),
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
    };
  } catch (error) {
    throw error;
  }
};
/**
 * 🔥 Filter bàn theo ngày và thời gian (TỐI ƯU)
 * @param {object} params - { date, startTime?, endTime?, page, limit, searchCapacity? }
 */
const filterTablesByDateService = async ({
  date,
  startTime,
  endTime,
  page,
  limit,
  searchCapacity,
}) => {
  try {
    const offset = (page - 1) * limit;

    const tableWhere = {};
    if (searchCapacity) {
      tableWhere.capacity = parseInt(searchCapacity, 10);
    }
    tableWhere.is_active = true; // Chỉ lấy bàn đang hoạt động

    // Xây dựng điều kiện check conflict
    let reservationWhere = {
      status: { [Op.in]: [1, 2, 3] }, // CONFIRMED, CHECKED_IN, COMPLETED
    };

    if (startTime && endTime) {
      // Check conflict theo thời gian cụ thể
      reservationWhere[Op.or] = [
        // Case 1: Có start_time và end_time
        {
          start_time: { [Op.ne]: null },
          end_time: { [Op.ne]: null },
          start_time: { [Op.lt]: endTime },
          end_time: { [Op.gt]: startTime },
        },
        // Case 2: Fallback về reservation_date (tương thích cũ)
        {
          start_time: null,
          end_time: null,
          reservation_date: {
            [Op.between]: [startTime, endTime],
          },
        },
      ];
    } else {
      // Check theo ngày (dùng start_time)
      reservationWhere[Op.and] = [
        sequelize.where(fn("DATE", col("Reservations.start_time")), date),
      ];
    }

    const includeCondition = {
      model: Reservation,
      as: "Reservations",
      attributes: [],
      required: false,
      where: reservationWhere,
    };

    // COUNT DISTINCT table.id
    const totalCount = await Table.count({
      where: tableWhere,
      include: [includeCondition],
      distinct: true,
      col: "id",
    });

    // Lấy danh sách bàn
    const results = await Table.findAll({
      where: tableWhere,
      attributes: [
        ["id", "table_id"],
        "code",
        "number",
        "capacity",
        [
          literal(`CASE 
                    WHEN COUNT(Reservations.id) > 0 THEN 0 
                    ELSE 1 
                  END`),
          "status",
        ],
        [fn("GROUP_CONCAT", col("Reservations.fullname")), "guest_name"],
        [fn("GROUP_CONCAT", col("Reservations.id")), "reservation_ids"],
        [
          fn("GROUP_CONCAT", col("Reservations.start_time")),
          "reservation_start_times",
        ],
        [
          fn("GROUP_CONCAT", col("Reservations.end_time")),
          "reservation_end_times",
        ],
      ],
      include: [includeCondition],
      group: ["Table.id"],
      order: [
        ["code", "ASC"],
        ["number", "ASC"],
      ],
      limit,
      offset,
      subQuery: false,
    });

    return {
      results,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
    };
  } catch (error) {
    console.error(" Lỗi filterTablesByDateService:", error);
    throw error;
  }
};
const createTableService = async ({ number, capacity, status }) => {
  try {
    const code = number != null ? String(number).trim() : "";
    if (!code) {
      const err = new Error("Số bàn là bắt buộc");
      err.code = "INVALID_INPUT";
      throw err;
    }

    const existingTable = await Table.findOne({
      where: { code },
    });

    if (existingTable) {
      const error = new Error("Bàn đã tồn tại");
      error.code = "DUPLICATE_TABLE";
      throw error;
    }

    const table = await Table.create({
      code,
      capacity: parseInt(capacity, 10) || 2,
      is_active: status === 0 ? false : true,
    });

    return table;
  } catch (error) {
    throw error;
  }
};
const updateTableService = async ({ id, number, capacity, status }) => {
  try {
    const table = await Table.findByPk(id);

    if (!table) {
      const error = new Error("Không tìm thấy bàn");
      error.code = "TABLE_NOT_FOUND";
      throw error;
    }

    const code = number != null ? String(number).trim() : table.code;

    const existedTable = await Table.findOne({
      where: {
        code,
        id: { [Op.ne]: id },
      },
    });

    if (existedTable) {
      const error = new Error("Số bàn đã tồn tại");
      error.code = "DUPLICATE_TABLE";
      throw error;
    }

    await table.update({
      code,
      capacity: parseInt(capacity, 10) ?? table.capacity,
      is_active: status === 0 ? false : true,
    });

    return true;
  } catch (error) {
    throw error;
  }
};
const updatePartialTableById = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    const table = await Table.findByPk(id, { transaction });

    if (!table) {
      throw {
        status: 404,
        message: "Không tìm thấy bàn",
      };
    }

    await table.update(updates, { transaction });

    await transaction.commit();
    return table;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const deleteTableById = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const table = await Table.findByPk(id, { transaction });

    if (!table) {
      throw {
        status: 404,
        message: "Không tìm thấy bàn",
      };
    }

    await table.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getReservationsByTableId = async (tableId) => {
  const reservations = await Reservation.findAll({
    where: { table_id: tableId },
    order: [["created_at", "DESC"]],
  });

  if (!reservations || reservations.length === 0) {
    throw {
      status: 404,
      message: "Không tìm thấy đơn đặt bàn cho bàn này",
    };
  }

  return reservations;
};

export {
  getTablesService,
  filterTablesByDateService,
  createTableService,
  updateTableService,
  updatePartialTableById,
  deleteTableById,
  getReservationsByTableId,
};

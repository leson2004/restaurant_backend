import { Op } from "sequelize";
import { Table, Reservation, sequelize } from "../models/index.js";

const getTablesService = async ({ search, searchCapacity, page, limit }) => {
  try {
    const offset = (page - 1) * limit;

    const whereCondition = {
      number: {
        [Op.like]: `%${search}%`,
      },
      capacity: {
        [Op.like]: `%${searchCapacity}%`,
      },
    };

    const { count, rows } = await Table.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Reservation,
          attributes: ["fullname"],
          required: false,
        },
      ],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return {
      results: rows.map((table) => ({
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        guest_name: table.Reservation?.fullname || null,
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
const filterTablesByDateService = async ({
  date,
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

    const includeCondition = {
      model: Reservation,
      attributes: [],
      required: false,
      where: {
        [Op.and]: [
          sequelize.where(fn("DATE", col("reservation_date")), date),
          { status: { [Op.in]: [3, 4] } },
        ],
      },
    };

    // COUNT DISTINCT table.id
    const totalCount = await Table.count({
      where: tableWhere,
      include: [includeCondition],
      distinct: true,
      col: "Table.id",
    });

    const results = await Table.findAll({
      where: tableWhere,
      attributes: [
        ["id", "table_id"],
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
      ],
      include: [includeCondition],
      group: ["Table.id"],
      order: [["number", "ASC"]],
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
    throw error;
  }
};
const createTableService = async ({ number, capacity, status }) => {
  try {
    const existingTable = await Table.findOne({
      where: { number },
    });

    if (existingTable) {
      const error = new Error("Bàn đã tồn tại");
      error.code = "DUPLICATE_TABLE";
      throw error;
    }

    const table = await Table.create({
      number,
      capacity,
      status,
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

    // Kiểm tra trùng số bàn (trừ chính nó)
    const existedTable = await Table.findOne({
      where: {
        number,
        id: { [Table.sequelize.Op.ne]: id },
      },
    });

    if (existedTable) {
      const error = new Error("Số bàn đã tồn tại");
      error.code = "DUPLICATE_TABLE";
      throw error;
    }

    await table.update({
      number,
      capacity,
      status,
      updated_at: new Date(),
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

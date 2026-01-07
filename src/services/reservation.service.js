import { Reservation, Table, Promotion, sequelize } from "../models/index.js";
import { Op } from "sequelize";
export const getAllTablesWithReservationsService = async () => {
  const transaction = await sequelize.transaction();

  try {
    const tables = await Table.findAll({
      attributes: ["id", "number", "capacity", "status"],
      include: [
        {
          model: Reservation,
          attributes: [["fullname", "guest_name"]],
          required: false, // LEFT JOIN
        },
      ],
      transaction,
    });

    await transaction.commit();
    return tables;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
export const getTableWithReservationByIdService = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const table = await Table.findOne({
      where: { id },
      attributes: ["id", "number", "capacity", "status"],
      include: [
        {
          model: Reservation,
          attributes: [["fullname", "guest_name"]],
          required: false, // LEFT JOIN
        },
      ],
      transaction,
    });

    if (!table) {
      const error = new Error("Table not found");
      error.statusCode = 404;
      throw error;
    }

    await transaction.commit();
    return table;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const findAvailableTable = async (reservationDate, partySize, transaction) => {
  const table = await Table.findOne({
    where: {
      capacity: { [Op.gte]: partySize },
      id: {
        [Op.notIn]: sequelize.literal(`
          (
            SELECT table_id
            FROM reservations
            WHERE DATE(reservation_date) = DATE('${reservationDate}')
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

export const createReservation = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      reservation_code,
      user_id,
      promotion_id,
      fullname,
      tel,
      email,
      reservation_date,
      party_size,
      note,
      total_amount,
    } = data;

    const total = total_amount ? parseFloat(total_amount) : 0;
    const deposit = total * 0.3;
    const status = 1;

    const tableId = await findAvailableTable(
      reservation_date,
      party_size,
      transaction
    );

    const reservation = await Reservation.create(
      {
        reservation_code,
        user_id,
        promotion_id,
        fullname,
        tel,
        email,
        reservation_date,
        party_size,
        note,
        total_amount: total,
        deposit,
        status,
        table_id: tableId,
      },
      { transaction }
    );

    if (promotion_id) {
      const updated = await Promotion.update(
        { quantity: sequelize.literal("quantity - 1") },
        {
          where: { id: promotion_id, quantity: { [Op.gt]: 0 } },
          transaction,
        }
      );

      if (updated[0] === 0) {
        throw new Error("PROMOTION_OUT_OF_STOCK");
      }
    }

    await transaction.commit();

    return {
      reservationId: reservation.id,
      tableId,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
export const updateReservationById = async (id, data) => {
  const transaction = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(id, { transaction });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // Nếu có promotion_id → KHÔNG tăng/giảm lại số lượng
    // (giữ nguyên logic nghiệp vụ gốc của bạn)

    await reservation.update(
      {
        user_id: data.user_id,
        promotion_id: data.promotion_id,
        fullname: data.fullname,
        tel: data.tel,
        email: data.email,
        reservation_date: data.reservation_date,
        party_size: data.party_size,
        note: data.note,
        total_amount: data.total_amount,
        deposit: data.deposit,
        status: data.status,
      },
      { transaction }
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
export const patchReservationById = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(id, { transaction });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // PATCH: chỉ update các field được truyền lên
    await reservation.update(updates, { transaction });

    await transaction.commit();
    return reservation;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
export const deleteReservationById = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(id, { transaction });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    await reservation.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

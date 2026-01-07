const { Op } = require("sequelize");
const Promotion = require("../models/index");

const getAllPromotions = async ({ search, page, limit }) => {
  try {
    const whereCondition = {
      code_name: {
        [Op.like]: `%${search}%`,
      },
    };

    // Đếm tổng số bản ghi
    const totalCount = await Promotion.count({ where: whereCondition });

    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    // Lấy danh sách promotions
    const results = await Promotion.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return {
      results,
      totalCount,
      totalPages,
    };
  } catch (error) {
    throw error;
  }
};
const getPromotionById = async (id) => {
  try {
    const promotion = await Promotion.findByPk(id);

    if (!promotion) {
      const error = new Error("Promotions not found");
      error.statusCode = 404;
      throw error;
    }

    return promotion;
  } catch (error) {
    throw error;
  }
};
const createPromotion = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    const promotion = await Promotion.create(
      {
        code_name: data.code_name,
        discount: data.discount,
        quantity: data.quantity,
        valid_from: data.valid_from,
        valid_to: data.valid_to,
        type: data.type,
      },
      { transaction }
    );

    await transaction.commit();
    return promotion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const updatePromotionById = async (id, data) => {
  const transaction = await sequelize.transaction();

  try {
    const promotion = await Promotion.findByPk(id, { transaction });

    if (!promotion) {
      const error = new Error("Promotions not found");
      error.statusCode = 404;
      throw error;
    }

    await promotion.update(
      {
        code_name: data.name, // giữ logic nghiệp vụ theo code cũ
        discount: data.discount,
        quantity: data.quantity,
        valid_from: data.valid_from,
        valid_to: data.valid_to,
      },
      { transaction }
    );

    await transaction.commit();
    return promotion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const patchPromotionById = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    const promotion = await Promotion.findByPk(id, { transaction });

    if (!promotion) {
      const error = new Error("Promotions not found");
      error.statusCode = 404;
      throw error;
    }

    // Cập nhật động các field (giống SET ? trong SQL)
    await promotion.update(
      {
        ...updates,
      },
      { transaction }
    );

    await transaction.commit();
    return promotion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const deletePromotionById = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const promotion = await Promotion.findByPk(id, { transaction });

    if (!promotion) {
      const error = new Error("Promotions not found");
      error.statusCode = 404;
      throw error;
    }

    await promotion.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotionById,
  patchPromotionById,
  deletePromotionById,
};

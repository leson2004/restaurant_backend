const { Op } = require("sequelize");
const { Promotion } = require("../models/index");

/**
 * Map promotion type to discount_type for API response.
 * type 1 (đặc biệt) => "percent", type 0 (thường) => "fixed"
 */
const getDiscountType = (type) => (parseInt(type, 10) === 1 ? "percent" : "fixed");

/**
 * Get promotions for public (e.g. Pay page dropdown).
 * Query: type (e.g. 1 = special), valid_now (1 = only valid now, quantity > 0).
 * Returns list with discount_type in each item.
 */
const getValidPromotionsForPublic = async ({ type, valid_now }) => {
  const now = new Date();
  const where = {};

  if (type !== undefined && type !== null && type !== "") {
    where.type = parseInt(type, 10);
  }
  if (valid_now === 1 || valid_now === "1") {
    where.valid_from = { [Op.lte]: now };
    where.valid_to = { [Op.gte]: now };
    where.quantity = { [Op.gt]: 0 };
  }

  const results = await Promotion.findAll({
    where,
    order: [["id", "ASC"]],
    raw: true,
  });

  return results.map((row) => ({
    id: row.id,
    code_name: row.code_name,
    discount: parseFloat(row.discount),
    discount_type: getDiscountType(row.type),
    type: row.type,
    quantity: row.quantity,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
  }));
};

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
  getValidPromotionsForPublic,
  getDiscountType,
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotionById,
  patchPromotionById,
  deletePromotionById,
};

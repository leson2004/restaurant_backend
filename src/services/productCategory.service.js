const { sequelize, ProductCategory } = require("../models/index");
const { Op } = require("sequelize");

const getAllProductCategories = async ({
  search,
  searchStatus,
  page,
  limit,
}) => {
  const transaction = await sequelize.transaction();
  try {
    const offset = (page - 1) * limit;

    const whereCondition = {
      name: { [Op.like]: `%${search}%` },
      status: { [Op.like]: `%${searchStatus}%` },
    };

    // Đếm tổng bản ghi
    const totalCount = await ProductCategory.count({
      where: whereCondition,
      transaction,
    });

    // Lấy danh sách phân trang
    const results = await ProductCategory.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit,
      offset,
      transaction,
    });

    await transaction.commit();

    return {
      results,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getAllProductCategoriesNoPage = async () => {
  const transaction = await sequelize.transaction();
  try {
    const results = await ProductCategory.findAll({
      order: [["id", "DESC"]],
      transaction,
    });

    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getActiveProductCategories = async ({ search, page, limit }) => {
  const transaction = await sequelize.transaction();
  try {
    const offset = (page - 1) * limit;

    const whereCondition = {
      status: 1,
      name: {
        [Op.like]: `%${search}%`,
      },
    };

    // Đếm tổng bản ghi
    const totalCount = await ProductCategory.count({
      where: whereCondition,
      transaction,
    });

    // Lấy danh sách phân trang
    const results = await ProductCategory.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit,
      offset,
      transaction,
    });

    await transaction.commit();

    return {
      results,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getActiveCategoriesForSelect = async (search) => {
  const transaction = await sequelize.transaction();
  try {
    const results = await ProductCategory.findAll({
      where: {
        status: 1,
        name: {
          [Op.like]: `%${search}%`,
        },
      },
      order: [["id", "ASC"]],
      transaction,
    });

    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getProductCategoryById = async (id) => {
  const transaction = await sequelize.transaction();
  try {
    const category = await ProductCategory.findByPk(id, {
      transaction,
    });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    await transaction.commit();
    return category;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const createProductCategory = async ({ name, status }) => {
  const transaction = await sequelize.transaction();
  try {
    const newCategory = await ProductCategory.create(
      {
        name,
        status,
      },
      { transaction }
    );

    await transaction.commit();
    return newCategory;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const updateProductCategoryById = async (id, name) => {
  const transaction = await sequelize.transaction();
  try {
    const category = await ProductCategory.findByPk(id, { transaction });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    await category.update(
      {
        name,
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
const patchProductCategoryById = async (id, updates) => {
  const transaction = await sequelize.transaction();
  try {
    const category = await ProductCategory.findByPk(id, { transaction });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    // Chỉ update các field được gửi lên
    await category.update(updates, { transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const deleteProductCategoryById = async (id) => {
  const transaction = await sequelize.transaction();
  try {
    // 1️⃣ Kiểm tra danh mục tồn tại
    const category = await ProductCategory.findByPk(id, { transaction });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    // 2️⃣ Không cho xóa "Chưa phân loại"
    if (category.name === "Chưa phân loại") {
      const error = new Error('Cannot delete "Chưa phân loại" category');
      error.statusCode = 400;
      throw error;
    }

    // 3️⃣ Kiểm tra sản phẩm thuộc danh mục
    const products = await Product.findAll({
      where: { categories_id: id },
      transaction,
    });

    // 4️⃣ Nếu có sản phẩm → chuyển sang "Chưa phân loại"
    if (products.length > 0) {
      let uncategorizedCategory = await ProductCategory.findOne({
        where: { name: "Chưa phân loại" },
        transaction,
      });

      // Nếu chưa có → tạo mới
      if (!uncategorizedCategory) {
        uncategorizedCategory = await ProductCategory.create(
          {
            name: "Chưa phân loại",
            status: 1,
          },
          { transaction }
        );
      }

      // Chuyển toàn bộ sản phẩm
      await Product.update(
        { categories_id: uncategorizedCategory.id },
        {
          where: { categories_id: id },
          transaction,
        }
      );
    }

    // 5️⃣ Xóa danh mục
    await category.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
module.exports = {
  getAllProductCategories,
  getAllProductCategoriesNoPage,
  getActiveProductCategories,
  getActiveCategoriesForSelect,
  getProductCategoryById,
  createProductCategory,
  updateProductCategoryById,
  patchProductCategoryById,
  deleteProductCategoryById,
};

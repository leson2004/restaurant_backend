const { Op } = require("sequelize");
const { Product, sequelize } = require("../models/index");

const getAllProducts = async ({ searchName, page, pageSize }) => {
  const transaction = await sequelize.transaction();

  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Product.findAndCountAll({
      where: {
        name: {
          [Op.like]: `%${searchName}%`,
        },
      },
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
      transaction,
    });

    const totalPages = Math.ceil(count / pageSize);

    await transaction.commit();

    return {
      results: rows,
      totalCount: count,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message || "Failed to fetch products");
  }
};
const getActiveProducts = async ({ searchName, searchCateID, page, limit }) => {
  const transaction = await sequelize.transaction();

  try {
    const whereCondition = {
      status: 1,
      name: {
        [Op.like]: `%${searchName}%`,
      },
      categories_id: {
        [Op.like]: `%${searchCateID}%`,
      },
    };

    const offset = (page - 1) * limit;

    const queryOptions = {
      where: whereCondition,
      order: [["id", "DESC"]],
      transaction,
    };

    // Có phân trang
    if (page && limit) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    const { count, rows } = await Product.findAndCountAll(queryOptions);

    const totalPages = Math.ceil(count / limit);

    await transaction.commit();

    return {
      results: rows,
      totalCount: count,
      totalPages,
      currentPage: page,
      limit,
    };
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message || "Failed to fetch active products");
  }
};
const getMenuProducts = async ({ search }) => {
  const transaction = await sequelize.transaction();

  try {
    const products = await Product.findAll({
      where: {
        status: 1,
        name: {
          [Op.like]: `%${search}%`,
        },
      },
      order: [["id", "DESC"]],
      transaction,
    });

    await transaction.commit();

    return products;
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message || "Failed to fetch menu products");
  }
};
const getInactiveProducts = async ({
  searchName,
  searchCateID,
  page,
  limit,
}) => {
  const transaction = await sequelize.transaction();

  try {
    const whereCondition = {
      status: 0,
      name: {
        [Op.like]: `%${searchName}%`,
      },
      categories_id: {
        [Op.like]: `%${searchCateID}%`,
      },
    };

    const offset = (page - 1) * limit;

    const queryOptions = {
      where: whereCondition,
      order: [["id", "DESC"]],
      transaction,
    };

    // Có phân trang
    if (page && limit) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    const { count, rows } = await Product.findAndCountAll(queryOptions);

    const totalPages = Math.ceil(count / limit);

    await transaction.commit();

    return {
      results: rows,
      totalCount: count,
      totalPages,
      currentPage: page,
      limit,
    };
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message || "Failed to fetch inactive products");
  }
};
const getNewestProducts = async () => {
  const transaction = await sequelize.transaction();

  try {
    const products = await Product.findAll({
      where: {
        status: 1,
      },
      order: [["created_at", "DESC"]],
      limit: 8,
      transaction,
    });

    await transaction.commit();

    return products;
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message || "Failed to fetch newest products");
  }
};
const getProductBySlug = async (slug) => {
  const transaction = await sequelize.transaction();

  try {
    // ===== Xử lý slug giống logic cũ =====
    const decodedSlug = decodeURIComponent(slug).replace(/\.html$/, "");
    const name = decodedSlug.split("-").join(" ");

    const product = await Product.findOne({
      where: {
        name,
      },
      transaction,
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    await transaction.commit();
    return product;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const createProduct = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.create(
      {
        product_code: data.product_code,
        name: data.name,
        image: data.image,
        price: data.price,
        sale_price: data.sale_price,
        description: data.description,
        status: data.status,
        categories_id: data.category_id,
      },
      { transaction }
    );

    await transaction.commit();
    return product;
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message || "Failed to create product");
  }
};
const updateProductById = async (id, data) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(id, { transaction });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    await product.update(
      {
        product_code: data.product_code,
        name: data.name,
        image: data.image,
        price: data.price,
        sale_price: data.sale_price,
        description: data.description,
        status: data.status,
        categories_id: data.category_id,
      },
      { transaction }
    );

    await transaction.commit();
    return product;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const patchProductById = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(id, { transaction });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    // Chỉ update các field được gửi lên
    await product.update(updates, { transaction });

    await transaction.commit();
    return product;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const deleteProduct = async (id) => {
  const transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    await product.destroy({ transaction });
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
module.exports = {
  getAllProducts,
  getActiveProducts,
  getMenuProducts,
  getInactiveProducts,
  getNewestProducts,
  getProductBySlug,
  createProduct,
  updateProductById,
  patchProductById,
  deleteProduct,
};

const { Op } = require("sequelize");
const { BlogCategory } = require("../models/index");
const getAll = async ({ search, searchStatus, page, limit }) => {
  const offset = (page - 1) * limit;
  const whereCondition = {
    name: {
      [Op.like]: `%${search}%`,
    },
    status: {
      [Op.like]: `%${searchStatus}%`,
    },
  };

  //  Đếm tổng bản ghi
  const totalCount = await BlogCategory.count({
    where: whereCondition,
  });

  //  Lấy danh sách có phân trang
  const results = await BlogCategory.findAll({
    where: whereCondition,
    order: [["id", "DESC"]],
    limit,
    offset,
  });

  const totalPages = Math.ceil(totalCount / limit);

  return {
    results,
    totalCount,
    totalPages,
    currentPage: page,
    limit,
  };
};
const getById = async (id) => {
  const category = await BlogCategory.findByPk(id);

  if (!category) {
    const error = new Error("Không tìm thấy danh mục blog");
    error.statusCode = 404;
    throw error;
  }

  return category;
};
const create = async ({ name, status }) => {
  try {
    return await BlogCategory.create({
      name,
      status,
    });
  } catch (error) {
    // ✅ xử lý lỗi trùng key (UNIQUE)
    if (error instanceof Sequelize.UniqueConstraintError) {
      const err = new Error("Danh mục blog đã tồn tại");
      err.statusCode = 409;
      throw err;
    }

    throw error;
  }
};
const updateById = async (id, data) => {
  try {
    const category = await BlogCategory.findByPk(id);

    if (!category) {
      const err = new Error("Không tìm thấy danh mục blog");
      err.statusCode = 404;
      throw err;
    }

    // ❗ chỉ update field được phép
    if (data.name !== undefined) category.name = data.name;
    if (data.status !== undefined) category.status = data.status;

    await category.save();
  } catch (error) {
    // ✅ lỗi trùng tên
    if (error instanceof Sequelize.UniqueConstraintError) {
      const err = new Error("Danh mục blog đã tồn tại");
      err.statusCode = 409;
      throw err;
    }

    throw error;
  }
};
const deleteById = async (categoryId) => {
  const transaction = await sequelize.transaction();

  try {
    // 1 Kiểm tra danh mục
    const category = await BlogCategory.findByPk(categoryId, { transaction });

    if (!category) {
      const err = new Error("Danh mục không tồn tại");
      err.statusCode = 404;
      throw err;
    }

    // 2️ Không cho xóa "Chưa phân loại"
    if (category.name === "Chưa phân loại") {
      const err = new Error('Không thể xóa danh mục "Chưa phân loại"');
      err.statusCode = 400;
      throw err;
    }

    // 3️ Kiểm tra bài viết liên kết
    const postCount = await Blog.count({
      where: { blog_category_id: categoryId },
      transaction,
    });

    if (postCount > 0) {
      // 4️ Tìm hoặc tạo danh mục "Chưa phân loại"
      let [undefinedCategory] = await BlogCategory.findOrCreate({
        where: { name: "Chưa phân loại" },
        defaults: { status: 1 },
        transaction,
      });

      // 5️ Chuyển bài viết
      await Blog.update(
        { blog_category_id: undefinedCategory.id },
        { where: { blog_category_id: categoryId }, transaction }
      );
    }

    // 6️ Xóa danh mục
    await BlogCategory.destroy({
      where: { id: categoryId },
      transaction,
    });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
module.exports = {
  getAll,
  getById,
  create,
  updateById,
  deleteById,
};

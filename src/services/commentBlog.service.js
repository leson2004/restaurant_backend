const { CommentBlog, User, sequelize } = require("../models/index");
const { Op } = require("sequelize");

const getComments = async ({ searchName, page, limit }) => {
  const transaction = await sequelize.transaction();

  try {
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const offset = (pageNumber - 1) * limitNumber;

    const whereCondition = {
      content: {
        [Op.like]: `%${searchName}%`,
      },
    };

    // 🔢 Đếm tổng số comment
    const totalCount = await CommentBlog.count({
      where: whereCondition,
      transaction,
    });

    const totalPages = Math.ceil(totalCount / limitNumber);

    // 📄 Lấy danh sách comment + join user
    const results = await CommentBlog.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["fullname", "avatar"],
        },
      ],
      order: [["id", "DESC"]],
      limit: limitNumber,
      offset,
      transaction,
    });

    await transaction.commit();

    return {
      results,
      totalCount,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getCommentsByBlogId = async ({ blog_id, page, limit }) => {
  const transaction = await sequelize.transaction();

  try {
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const offset = (pageNumber - 1) * limitNumber;

    // 🔢 Đếm tổng comment theo blog_id
    const totalCount = await CommentBlog.count({
      where: { blog_id },
      transaction,
    });

    const totalPages = Math.ceil(totalCount / limitNumber);

    // 📄 Lấy danh sách comment + user
    const results = await CommentBlog.findAll({
      where: { blog_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["fullname", "avatar"],
        },
      ],
      order: [["id", "DESC"]],
      limit: limitNumber,
      offset,
      transaction,
    });

    await transaction.commit();

    return {
      results,
      totalCount,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const createComment = async ({ blog_id, user_id, content }) => {
  const transaction = await sequelize.transaction();

  try {
    const comment = await CommentBlog.create(
      {
        blog_id,
        user_id,
        content,
      },
      { transaction }
    );

    await transaction.commit();
    return comment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const updateCommentById = async ({ id, customer_id, content }) => {
  const transaction = await sequelize.transaction();

  try {
    const comment = await CommentBlog.findByPk(id, { transaction });

    if (!comment) {
      throw {
        status: 404,
        message: "Không tìm thấy bình luận",
      };
    }

    await comment.update(
      {
        customer_id,
        content,
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
const patchCommentById = async ({ id, updates }) => {
  const transaction = await sequelize.transaction();

  try {
    const comment = await CommentBlog.findByPk(id, { transaction });

    if (!comment) {
      throw {
        status: 404,
        message: "Không tìm thấy bình luận",
      };
    }

    // Update động các field được truyền lên
    await comment.update(updates, { transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const deleteCommentById = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const comment = await CommentBlog.findByPk(id, { transaction });

    if (!comment) {
      throw {
        status: 404,
        message: "Không tìm thấy bình luận",
      };
    }

    await comment.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
module.exports = {
  getComments,
  getCommentsByBlogId,
  createComment,
  updateCommentById,
  patchCommentById,
  deleteCommentById,
};

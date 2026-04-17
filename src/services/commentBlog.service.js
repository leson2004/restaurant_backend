const { CommentBlog, User, sequelize } = require("../models/index");
const { Op } = require("sequelize");

const getComments = async ({
  searchName,
  page,
  limit,
  includeAllStatuses = false,
}) => {
  const transaction = await sequelize.transaction();

  try {
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const offset = (pageNumber - 1) * limitNumber;

    const whereCondition = {
      content: {
        [Op.like]: `%${searchName}%`,
      },
      is_deleted: 0,
    };
    if (!includeAllStatuses) {
      whereCondition.moderation_status = "approved";
    }

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
const getCommentsByBlogId = async ({
  blog_id,
  page,
  limit,
  includeAllStatuses = false,
}) => {
  const transaction = await sequelize.transaction();

  try {
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const offset = (pageNumber - 1) * limitNumber;

    const whereBase = { blog_id, is_deleted: 0 };
    if (!includeAllStatuses) whereBase.moderation_status = "approved";

    const totalCount = await CommentBlog.count({
      where: whereBase,
      transaction,
    });

    const totalPages = Math.ceil(totalCount / limitNumber);

    const results = await CommentBlog.findAll({
      where: whereBase,
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
const createComment = async ({
  blog_id,
  user_id,
  content,
  toxicity_score = null,
  moderation_status = "approved",
  moderation_reason = null,
  is_deleted = 0,
}) => {
  const transaction = await sequelize.transaction();

  try {
    const comment = await CommentBlog.create(
      {
        blog_id,
        user_id,
        content,
        toxicity_score,
        moderation_status,
        moderation_reason,
        is_deleted,
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
const updateCommentById = async ({
  id,
  customer_id,
  content,
  toxicity_score = null,
  moderation_status = null,
  moderation_reason = null,
}) => {
  const transaction = await sequelize.transaction();

  try {
    const comment = await CommentBlog.findByPk(id, { transaction });

    if (!comment) {
      throw {
        status: 404,
        message: "Không tìm thấy bình luận",
      };
    }

    const updates = { content };
    if (customer_id !== undefined) updates.user_id = customer_id;
    if (toxicity_score !== undefined && toxicity_score !== null)
      updates.toxicity_score = toxicity_score;
    if (moderation_status) updates.moderation_status = moderation_status;
    if (moderation_reason !== undefined)
      updates.moderation_reason = moderation_reason;

    await comment.update(updates, { transaction });

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

    // 🗑️ Soft delete: chỉ set is_deleted = 1 thay vì xóa hoàn toàn
    await comment.update(
      {
        is_deleted: 1,
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
module.exports = {
  getComments,
  getCommentsByBlogId,
  createComment,
  updateCommentById,
  patchCommentById,
  deleteCommentById,
};

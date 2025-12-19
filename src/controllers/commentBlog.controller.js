const commentService = require("../services/commentBlog.service");

const getComments = async (req, res) => {
  try {
    const { searchName = "", page = 1, limit = 10 } = req.query;

    const data = await commentService.getComments({
      searchName,
      page,
      limit,
    });

    return res.status(200).json({
      message: "Fetch comments successfully",
      ...data,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);

    return res.status(500).json({
      error: "Failed to fetch comments",
    });
  }
};
const getCommentsByBlogId = async (req, res) => {
  try {
    const { blog_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // ✅ Validate trong controller
    if (!blog_id || isNaN(blog_id)) {
      return res.status(400).json({
        error: "Invalid blog_id",
      });
    }

    const data = await commentService.getCommentsByBlogId({
      blog_id,
      page,
      limit,
    });

    return res.status(200).json({
      message: "Fetch comments successfully",
      ...data,
    });
  } catch (error) {
    console.error("Error fetching comments by blog_id:", error);

    return res.status(500).json({
      error: "Failed to fetch comments",
    });
  }
};
const createComment = async (req, res) => {
  try {
    const { blog_id, user_id, content } = req.body;

    // ✅ Validate trong controller
    if (!blog_id || isNaN(blog_id)) {
      return res.status(400).json({
        error: "Invalid blog_id",
      });
    }

    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({
        error: "Invalid user_id",
      });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({
        error: "Content is required",
      });
    }

    await commentService.createComment({
      blog_id,
      user_id,
      content,
    });

    return res.status(201).json({
      message: "Thêm bình luận thành công",
    });
  } catch (error) {
    console.error("Lỗi khi tạo bình luận:", error);

    return res.status(500).json({
      error: "Không thể tạo bình luận",
    });
  }
};
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, content } = req.body;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid comment id",
      });
    }

    if (!customer_id || isNaN(customer_id)) {
      return res.status(400).json({
        error: "Invalid customer_id",
      });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({
        error: "Content is required",
      });
    }

    await commentService.updateCommentById({
      id,
      customer_id,
      content,
    });

    return res.status(200).json({
      message: "Cập nhật bình luận thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật bình luận:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Không thể cập nhật bình luận",
    });
  }
};
const patchComment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid comment id",
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No fields provided for update",
      });
    }

    //  Không cho update các field nguy hiểm (nếu cần)
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    await commentService.patchCommentById({
      id,
      updates,
    });

    return res.status(200).json({
      message: "Cập nhật một phần bình luận thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật một phần bình luận:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Không thể cập nhật một phần bình luận",
    });
  }
};
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid comment id",
      });
    }

    await commentService.deleteCommentById(id);

    return res.status(200).json({
      message: "Xóa bình luận thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa bình luận:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Không thể xóa bình luận",
    });
  }
};

module.exports = {
  getComments,
  getCommentsByBlogId,
  createComment,
  updateComment,
  patchComment,
};

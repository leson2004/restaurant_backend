const commentService = require("../services/commentBlog.service");
const geminiModerationService = require("../services/geminiModeration.service");

const getComments = async (req, res) => {
  try {
    const {
      searchName = "",
      page = 1,
      limit = 10,
      include_all_statuses: includeAllStatuses = false,
    } = req.query;

    const data = await commentService.getComments({
      searchName,
      page,
      limit,
      includeAllStatuses: includeAllStatuses === "1" || includeAllStatuses === "true",
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
    const {
      page = 1,
      limit = 10,
      include_all_statuses: includeAllStatuses = false,
    } = req.query;

    if (!blog_id || isNaN(blog_id)) {
      return res.status(400).json({
        error: "Invalid blog_id",
      });
    }

    const data = await commentService.getCommentsByBlogId({
      blog_id,
      page,
      limit,
      includeAllStatuses: includeAllStatuses === "1" || includeAllStatuses === "true",
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

    // ✅ Validate inputs
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

    // 🤖 Gọi Gemini AI để phân tích nội dung
    const moderationResult =
      await geminiModerationService.analyzeCommentToxicity(content);

    // 📊 Xác định trạng thái moderation
    const moderation_status = geminiModerationService.getModerationStatus(
      moderationResult.toxicity_score,
    );

    // ❌ Nếu rejected - không lưu vào DB
    if (moderation_status === "rejected") {
      return res.status(400).json({
        status: "rejected",
        message: "Bình luận chứa nội dung không phù hợp",
        reason: moderationResult.reason,
      });
    }

    // 💾 Lưu comment vào database
    const savedComment = await commentService.createComment({
      blog_id,
      user_id,
      content,
      toxicity_score: moderationResult.toxicity_score,
      moderation_status,
      moderation_reason: moderationResult.reason,
      is_deleted: 0,
    });

    // ⚠️ Nếu hidden - thông báo cho user
    if (moderation_status === "hidden") {
      return res.status(201).json({
        status: "hidden",
        message: "Bình luận của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng",
        comment: savedComment,
      });
    }

    // ✅ Nếu approved - trả bình thường (isFailOpen: true khi moderation bị bỏ qua do lỗi API)
    const payload = {
      status: "approved",
      message: "Thêm bình luận thành công",
      comment: savedComment,
    };
    if (moderationResult.isFailOpen) payload.moderation_skipped = true;
    return res.status(201).json(payload);
  } catch (error) {
    console.error("Lỗi khi tạo bình luận:", error);

    return res.status(500).json({
      error: "Không thể tạo bình luận",
    });
  }
};
const updateComment = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const { customer_id, user_id, content } = req.body;
    const ownerId = customer_id ?? user_id;

    // ✅ Validate
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: "Invalid comment id",
      });
    }

    if (!ownerId || isNaN(Number(ownerId))) {
      return res.status(400).json({
        error: "Invalid customer_id or user_id",
      });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({
        error: "Content is required",
      });
    }

    // 🤖 Re-run moderation when content changes
    const moderationResult =
      await geminiModerationService.analyzeCommentToxicity(content);
    const moderation_status = geminiModerationService.getModerationStatus(
      moderationResult.toxicity_score,
    );

    if (moderation_status === "rejected") {
      return res.status(400).json({
        status: "rejected",
        message: "Nội dung chỉnh sửa không phù hợp",
        reason: moderationResult.reason,
      });
    }

    await commentService.updateCommentById({
      id: Number(id),
      customer_id: Number(ownerId),
      content,
      toxicity_score: moderationResult.toxicity_score,
      moderation_status,
      moderation_reason: moderationResult.reason,
    });

    const payload = {
      message: "Cập nhật bình luận thành công",
      status: moderation_status,
    };
    if (moderationResult.isFailOpen) payload.moderation_skipped = true;
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Lỗi khi cập nhật bình luận:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Không thể cập nhật bình luận",
    });
  }
};
const patchComment = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const updates = { ...req.body };
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: "Invalid comment id",
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No fields provided for update",
      });
    }

    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    if (updates.content !== undefined && updates.content !== null) {
      const moderationResult =
        await geminiModerationService.analyzeCommentToxicity(
          String(updates.content).trim() || "",
        );
      const moderation_status = geminiModerationService.getModerationStatus(
        moderationResult.toxicity_score,
      );
      if (moderation_status === "rejected") {
        return res.status(400).json({
          status: "rejected",
          message: "Nội dung chỉnh sửa không phù hợp",
          reason: moderationResult.reason,
        });
      }
      updates.toxicity_score = moderationResult.toxicity_score;
      updates.moderation_status = moderation_status;
      updates.moderation_reason = moderationResult.reason;
    }

    await commentService.patchCommentById({
      id: Number(id),
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
    const id = req.params.id || req.body.id;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: "Invalid comment id",
      });
    }

    await commentService.deleteCommentById(Number(id));

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
  deleteComment,
};

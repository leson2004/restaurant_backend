// controllers/blogCategory.controller.js
const blogCategoryService = require("../services/blogCategory.service");

const getAll = async (req, res) => {
  try {
    const { search = "", searchStatus = "", page = 1, limit = 5 } = req.query;

    //  validate + convert trong controller
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 5;
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;

    const data = await blogCategoryService.getAll({
      search,
      searchStatus,
      page: pageNumber,
      limit: limitNumber,
    });

    return res.status(200).json({
      message: "Fetched blog categories successfully",
      ...data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Lỗi server",
    });
  }
};
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ validate đơn giản
    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID danh mục không hợp lệ",
      });
    }

    const category = await blogCategoryService.getById(id);

    return res.status(200).json({
      message: "Lấy thông tin danh mục blog thành công",
      data: category,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Lỗi server",
    });
  }
};
const create = async (req, res) => {
  try {
    const { name, status } = req.body;

    // ✅ validate tại controller
    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Name is required",
      });
    }

    if (status === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Status is required",
      });
    }

    const category = await blogCategoryService.create({
      name: name.trim(),
      status,
    });

    return res.status(201).json({
      message: "Thêm danh mục blog thành công",
      categoryId: category.id,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Không thể tạo danh mục blog",
    });
  }
};
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    // ✅ validate
    if (name === undefined && status === undefined) {
      return res.status(400).json({
        status: "error",
        message: "At least one field (name or status) is required for update",
      });
    }

    await blogCategoryService.updateById(id, { name, status });

    return res.status(200).json({
      message: "Cập nhật danh mục blog thành công",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Không thể cập nhật danh mục blog",
    });
  }
};
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "Category id is required",
      });
    }

    await blogCategoryService.deleteById(id);

    return res.status(200).json({
      message: "Danh mục blog đã được xóa và xử lý bài viết thành công",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Không thể xóa danh mục blog",
    });
  }
};
module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};

const permissionService = require("../services/permission.service");

const getAllPermissions = async (req, res) => {
  try {
    const results = await permissionService.getAllPermissions();

    return res.status(200).json({
      message: "Permissions fetched successfully",
      results,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Unable to fetch permissions",
    });
  }
};
const getPermissionById = async (req, res) => {
  const { id } = req.params;

  // Validate trong controller
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: "ID quyền hạn không hợp lệ",
    });
  }

  try {
    const permission = await permissionService.getPermissionById(id);

    return res.status(200).json(permission);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin quyền hạn:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Không thể lấy thông tin quyền hạn",
    });
  }
};
const createPermission = async (req, res) => {
  const { name } = req.body;

  // Validate trong controller
  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Tên quyền hạn là bắt buộc",
    });
  }

  try {
    await permissionService.createPermission(name.trim());

    return res.status(201).json({
      message: "Thêm quyền hạn thành công",
    });
  } catch (error) {
    console.error("Lỗi khi tạo quyền hạn:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Không thể tạo quyền hạn",
    });
  }
};
const updatePermission = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  // Validate trong controller
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: "ID quyền hạn không hợp lệ",
    });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Tên quyền hạn là bắt buộc",
    });
  }

  try {
    await permissionService.updatePermission(id, name.trim());

    return res.status(200).json({
      message: "Cập nhật quyền hạn thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật quyền hạn:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Không thể cập nhật quyền hạn",
    });
  }
};
const patchPermission = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Validate
  if (!id || isNaN(id)) {
    return res.status(400).json({
      error: "ID quyền hạn không hợp lệ",
    });
  }

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: "Không có dữ liệu để cập nhật",
    });
  }

  try {
    await permissionService.patchPermission(id, updates);

    return res.status(200).json({
      message: "Cập nhật một phần quyền hạn thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật một phần quyền hạn:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Không thể cập nhật một phần quyền hạn",
    });
  }
};
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "ID quyền hạn không hợp lệ",
      });
    }

    await permissionService.deletePermissionById(id);

    return res.status(200).json({
      message: "Xóa quyền hạn thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa quyền hạn:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Không thể xóa quyền hạn",
    });
  }
};
module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  patchPermission,
  deletePermission,
};

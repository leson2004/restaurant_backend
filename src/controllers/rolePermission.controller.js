const rolePermissionService = require("../services/rolePermission.service");

const getPermissionsByRoleId = async (req, res) => {
  try {
    const { role_id } = req.query;

    // ✅ Validate trong controller
    if (!role_id || isNaN(role_id)) {
      return res.status(400).json({
        error: "Invalid role_id",
      });
    }

    const results = await rolePermissionService.getPermissionsByRoleId(role_id);

    return res.status(200).json({
      message: "Show list role successfully",
      results,
    });
  } catch (error) {
    console.error("Error fetching role_permissions:", error);

    return res.status(500).json({
      error: "Failed to fetch role_permissions",
    });
  }
};
const getRolePermissionByRoleId = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid role id",
      });
    }

    const rolePermission =
      await rolePermissionService.getRolePermissionByRoleId(id);

    return res.status(200).json(rolePermission);
  } catch (error) {
    if (error.message === "ROLE_NOT_FOUND") {
      return res.status(404).json({
        error: "Không tìm thấy vai trò",
      });
    }

    console.error("Lỗi khi lấy thông tin vai trò:", error);
    return res.status(500).json({
      error: "Không thể lấy thông tin vai trò",
    });
  }
};
const addPermissionsToRole = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const permissions = req.body;

    // ✅ Validate trong controller
    if (!Array.isArray(permissions) || permissions.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Permissions must be a non-empty array",
      });
    }

    for (const p of permissions) {
      if (!p.role_id || !p.permission_id) {
        await transaction.rollback();
        return res.status(400).json({
          error: "role_id and permission_id are required",
        });
      }
    }

    const result = await rolePermissionService.addPermissionsToRole(
      permissions,
      transaction
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Thêm quyền hạn vào vai trò thành công",
      affectedRows: result.length,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Lỗi khi tạo thêm quyền hạn vào vai trò:", error);
    return res.status(500).json({
      error: "Không thể tạo quyền hạn vào vai trò",
    });
  }
};
const updateRolePermissionById = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Invalid role id",
      });
    }

    if (!name) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Name is required",
      });
    }

    await rolePermissionService.updateRolePermissionById(
      id,
      { name, description },
      transaction
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Cập nhật vai trò thành công",
    });
  } catch (error) {
    await transaction.rollback();

    if (error.message === "ROLE_DUPLICATE") {
      return res.status(409).json({
        error: "Vai trò đã tồn tại",
      });
    }

    if (error.message === "ROLE_NOT_FOUND") {
      return res.status(404).json({
        error: "Không tìm thấy vai trò",
      });
    }

    console.error("Lỗi khi cập nhật vai trò:", error);
    return res.status(500).json({
      error: "Không thể cập nhật vai trò",
    });
  }
};
const patchRolePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ Validate trong controller
    if (!updates.name) {
      return res.status(400).json({
        error: "Name is required",
      });
    }

    await rolePermissionService.updateRolePermissionPatch(id, updates);

    return res.status(200).json({
      message: "Cập nhật một phần vai trò thành công",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || "Không thể cập nhật một phần vai trò",
    });
  }
};
const deleteRolePermission = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id) {
      return res.status(400).json({
        error: "Role id is required",
      });
    }

    await rolePermissionService.deleteRoleByRoleId(id);

    return res.status(200).json({
      message: "Xóa vai trò thành công",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || "Không thể xóa vai trò",
    });
  }
};

module.exports = {
  getPermissionsByRoleId,
  getRolePermissionByRoleId,
  addPermissionsToRole,
  updateRolePermissionById,
  patchRolePermission,
  deleteRolePermission,
};

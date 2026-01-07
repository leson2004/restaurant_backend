const roleService = require("../services/role.service");
const { sequelize } = require("../models/index");
const getAllRoles = async (req, res) => {
  try {
    let { search = "", page = 1, limit = 10 } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // ✅ Validate
    if (isNaN(page) || page <= 0) page = 1;
    if (isNaN(limit) || limit <= 0) limit = 10;

    const data = await roleService.getRolesWithPagination({
      search,
      page,
      limit,
    });

    return res.status(200).json({
      message: "Show list roles successfully",
      results: data.roles,
      totalCount: data.totalCount,
      totalPages: data.totalPages,
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return res.status(500).json({
      message: "Failed to fetch roles",
      error: error.message,
    });
  }
};
const getRoleDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate
    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "Invalid role id",
      });
    }

    const role = await roleService.getRoleById(Number(id));

    return res.status(200).json(role);
  } catch (error) {
    console.error("Error fetching role detail:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to fetch role",
    });
  }
};
const createRole = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, description } = req.body;

    // ✅ Validate
    if (!name || name.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const role = await roleService.createRole(
      { name, description },
      transaction
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Thêm vai trò thành công",
      roleId: role.id,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Error creating role:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Không thể tạo vai trò",
    });
  }
};
const updateRolePartial = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ Validate
    if (!id || isNaN(id)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Invalid role id",
      });
    }

    if (!updates.name || updates.name.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Name is required",
      });
    }

    await roleService.updateRoleById(Number(id), updates, transaction);

    await transaction.commit();

    return res.status(200).json({
      message: "Cập nhật một phần vai trò thành công",
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Error updating role:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Không thể cập nhật một phần vai trò",
    });
  }
};
const updateRoleFull = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // ✅ Validate
    if (!id || isNaN(id)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Invalid role id",
      });
    }

    if (!name || name.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Name is required",
      });
    }

    await roleService.updateRoleFullById(
      Number(id),
      { name, description },
      transaction
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Cập nhật vai trò thành công",
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Error updating role:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Không thể cập nhật vai trò",
    });
  }
};
const deleteRole = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // ✅ Validate
    if (!id || isNaN(id)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Invalid role id",
      });
    }

    await roleService.deleteRoleById(Number(id), transaction);

    await transaction.commit();

    return res.status(200).json({
      message: "Xóa vai trò thành công và các tài khoản đã được cập nhật",
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Error deleting role:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Không thể xóa vai trò",
    });
  }
};
module.exports = {
  getAllRoles,
  getRoleDetail,
  createRole,
  updateRolePartial,
  deleteRole,
  updateRoleFull,
};

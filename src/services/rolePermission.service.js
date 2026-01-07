const db = require("../models");
const { RolePermission, sequelize } = require("../models/index");
const getPermissionsByRoleId = async (roleId) => {
  try {
    return await db.RolePermission.findAll({
      where: { role_id: roleId },
      attributes: ["role_id"],
      include: [
        {
          model: db.Permission,
          attributes: [
            "id",
            "title",
            "name",
            "label",
            "createdAt",
            "updatedAt",
          ],
        },
      ],
    });
  } catch (error) {
    throw new Error("FETCH_ROLE_PERMISSIONS_FAILED");
  }
};
const getRolePermissionByRoleId = async (roleId) => {
  try {
    const rolePermissions = await db.RolePermission.findAll({
      where: { role_id: roleId },
    });

    if (!rolePermissions || rolePermissions.length === 0) {
      throw new Error("ROLE_NOT_FOUND");
    }

    // ⚠️ Giữ nguyên logic cũ: chỉ lấy bản ghi đầu tiên
    return rolePermissions[0];
  } catch (error) {
    throw error;
  }
};
const addPermissionsToRole = async (permissions, transaction) => {
  try {
    // Chuẩn hóa dữ liệu cho Sequelize
    const records = permissions.map((p) => ({
      role_id: p.role_id,
      permission_id: p.permission_id,
    }));

    const result = await db.RolePermission.bulkCreate(records, {
      transaction,
    });

    return result;
  } catch (error) {
    throw new Error("ADD_ROLE_PERMISSIONS_FAILED");
  }
};
const updateRolePermissionById = async (id, data, transaction) => {
  try {
    const rolePermission = await db.RolePermission.findByPk(id, {
      transaction,
    });

    if (!rolePermission) {
      throw new Error("ROLE_NOT_FOUND");
    }

    await rolePermission.update(
      {
        name: data.name,
        description: data.description,
      },
      { transaction }
    );

    return rolePermission;
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new Error("ROLE_DUPLICATE");
    }
    throw error;
  }
};
const updateRolePermissionPatch = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    const rolePermission = await RolePermission.findByPk(id, { transaction });

    if (!rolePermission) {
      throw {
        status: 404,
        message: "Không tìm thấy vai trò",
      };
    }

    // Giữ nguyên logic nghiệp vụ
    if (rolePermission.name === "Chưa phân loại") {
      throw {
        status: 403,
        message: 'Không thể chỉnh sửa vai trò "Chưa phân loại"',
      };
    }

    await rolePermission.update(updates, { transaction });

    await transaction.commit();
    return rolePermission;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const deleteRoleByRoleId = async (roleId) => {
  const transaction = await sequelize.transaction();

  try {
    const deletedRows = await RolePermission.destroy({
      where: { role_id: roleId },
      transaction,
    });

    if (deletedRows === 0) {
      throw {
        status: 404,
        message: "Không tìm thấy vai trò",
      };
    }

    await transaction.commit();
    return deletedRows;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
module.exports = {
  getPermissionsByRoleId,
  getRolePermissionByRoleId,
  addPermissionsToRole,
  updateRolePermissionById,
  updateRolePermissionPatch,
  deleteRoleByRoleId,
};

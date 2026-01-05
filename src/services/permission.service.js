const { Permission } = require("../models/index");

const getAllPermissions = async () => {
  const permissions = await Permission.findAll();

  if (!permissions || permissions.length === 0) {
    throw {
      status: 404,
      message: "Không tìm thấy quyền hạn nào",
    };
  }

  return permissions;
};
const getPermissionById = async (id) => {
  const permission = await Permission.findByPk(id);

  if (!permission) {
    throw {
      status: 404,
      message: "Không tìm thấy quyền hạn",
    };
  }

  return permission;
};
const createPermission = async (name) => {
  // Kiểm tra trùng tên quyền hạn
  const existingPermission = await Permission.findOne({
    where: { name },
  });

  if (existingPermission) {
    throw {
      status: 400,
      message: "Tên quyền hạn đã tồn tại",
    };
  }

  // Tạo quyền hạn mới
  const permission = await Permission.create({ name });

  return permission;
};
const updatePermission = async (id, name) => {
  // Kiểm tra quyền hạn có tồn tại không
  const permission = await Permission.findByPk(id);
  if (!permission) {
    throw {
      status: 404,
      message: "Không tìm thấy quyền hạn",
    };
  }

  // Kiểm tra trùng tên (loại trừ chính nó)
  const duplicatePermission = await Permission.findOne({
    where: {
      name,
      id: { [require("sequelize").Op.ne]: id },
    },
  });

  if (duplicatePermission) {
    throw {
      status: 400,
      message: "Tên quyền hạn đã tồn tại",
    };
  }

  // Cập nhật
  await permission.update({
    name,
    updated_at: new Date(),
  });

  return permission;
};
const patchPermission = async (id, updates) => {
  const permission = await Permission.findByPk(id);

  if (!permission) {
    throw {
      status: 404,
      message: "Không tìm thấy quyền hạn",
    };
  }

  // Cập nhật một phần field
  await permission.update({
    ...updates,
    updated_at: new Date(),
  });

  return permission;
};
const deletePermissionById = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const permission = await db.Permission.findByPk(id, { transaction });

    if (!permission) {
      throw {
        status: 404,
        message: "Không tìm thấy quyền hạn",
      };
    }

    await permission.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  patchPermission,
  deletePermissionById,
};

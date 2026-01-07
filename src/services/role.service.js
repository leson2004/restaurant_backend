const { Op } = require("sequelize");
const { sequelize, Role, Employee } = require("../models/index");

const getRolesWithPagination = async ({ search, page, limit }) => {
  const transaction = await sequelize.transaction();

  try {
    const offset = (page - 1) * limit;

    const whereCondition = {
      name: {
        [Op.like]: `%${search}%`,
      },
    };

    // Đếm tổng bản ghi
    const totalCount = await Role.count({
      where: whereCondition,
      transaction,
    });

    // Lấy danh sách
    const roles = await Role.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit,
      offset,
      transaction,
    });

    await transaction.commit();

    return {
      roles,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getRoleById = async (id) => {
  const role = await Role.findByPk(id);

  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  return role;
};

const createRole = async ({ name, description }, transaction) => {
  try {
    const role = await Role.create(
      {
        name,
        description,
      },
      { transaction }
    );

    return role;
  } catch (error) {
    // Duplicate entry
    if (error.name === "SequelizeUniqueConstraintError") {
      const err = new Error("Vai trò đã tồn tại");
      err.statusCode = 409;
      throw err;
    }

    throw error;
  }
};
const updateRoleById = async (id, updates, transaction) => {
  const role = await Role.findByPk(id, { transaction });

  if (!role) {
    const err = new Error("Không tìm thấy vai trò");
    err.statusCode = 404;
    throw err;
  }

  // ❌ Không cho sửa vai trò "Chưa phân loại"
  if (role.name === "Chưa phân loại") {
    const err = new Error('Không thể chỉnh sửa vai trò "Chưa phân loại"');
    err.statusCode = 403;
    throw err;
  }

  try {
    await role.update(
      {
        ...updates,
        updated_at: new Date(),
      },
      { transaction }
    );
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const err = new Error("Vai trò đã tồn tại");
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }

  return role;
};
const updateRoleFullById = async (id, { name, description }, transaction) => {
  const role = await Role.findByPk(id, { transaction });

  if (!role) {
    const err = new Error("Không tìm thấy vai trò");
    err.statusCode = 404;
    throw err;
  }

  try {
    await role.update(
      {
        name,
        description,
        updated_at: new Date(),
      },
      { transaction }
    );
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const err = new Error("Vai trò đã tồn tại");
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }

  return role;
};
const deleteRoleById = async (id, transaction) => {
  // 1. Lấy role cần xóa
  const role = await Role.findByPk(id, { transaction });

  if (!role) {
    const err = new Error("Không tìm thấy vai trò");
    err.statusCode = 404;
    throw err;
  }

  if (role.name === "Chưa phân loại") {
    const err = new Error('Không thể xóa vai trò "Chưa phân loại"');
    err.statusCode = 400;
    throw err;
  }

  // 2. Lấy role "Chưa phân loại"
  const defaultRole = await Role.findOne({
    where: { name: "Chưa phân loại" },
    transaction,
  });

  if (!defaultRole) {
    const err = new Error('Không tồn tại vai trò "Chưa phân loại"');
    err.statusCode = 500;
    throw err;
  }

  // 3. Update employee về role mặc định
  await Employee.update(
    { role_id: defaultRole.id },
    {
      where: { role_id: id },
      transaction,
    }
  );

  // 4. Xóa role
  await role.destroy({ transaction });
};

module.exports = {
  getRolesWithPagination,
  getRoleById,
  createRole,
  updateRoleById,
  deleteRoleById,
  updateRoleFullById,
};

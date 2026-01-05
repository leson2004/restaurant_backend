const { Employee, sequelize } = require("../models/index");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");

const saltRounds = 10;

const getEmployeesWithPagination = async ({ search, page, pageSize }) => {
  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Employee.findAndCountAll({
      where: {
        fullname: {
          [Op.like]: `%${search}%`,
        },
      },
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
    });

    return {
      results: rows,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    };
  } catch (error) {
    throw {
      status: 500,
      message: "Failed to fetch employees",
    };
  }
};
const getEmployeeById = async (id) => {
  try {
    const employee = await Employee.findByPk(id);

    if (!employee) {
      throw {
        status: 404,
        message: "Employees not found",
      };
    }

    return employee;
  } catch (error) {
    throw error.status
      ? error
      : { status: 500, message: "Failed to fetch employees" };
  }
};
const createEmployee = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const employee = await Employee.create(
      {
        fullname: data.fullname,
        avatar: data.avatar,
        email: data.email,
        tel: data.tel,
        address: data.address,
        password: hashedPassword,
        role_id: data.role_id,
        status: data.status,
      },
      { transaction }
    );

    await transaction.commit();
    return employee;
  } catch (error) {
    await transaction.rollback();
    throw {
      status: 500,
      message: "Failed to create employees",
    };
  }
};
const updateEmployeeById = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    const employee = await Employee.findByPk(id, { transaction });

    if (!employee) {
      throw {
        status: 404,
        message: "Employee not found",
      };
    }

    // Hash password nếu có
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, saltRounds);
    }

    await employee.update(
      {
        fullname: updates.fullname,
        avatar: updates.avatar,
        email: updates.email,
        tel: updates.tel,
        address: updates.address,
        password: updates.password,
        role_id: updates.role_id,
        status: updates.status,
      },
      { transaction }
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error.status
      ? error
      : { status: 500, message: "Failed to update employee" };
  }
};
const deleteEmployeeById = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const employee = await Employee.findByPk(id, { transaction });

    if (!employee) {
      throw {
        status: 404,
        message: "Employees not found",
      };
    }

    await employee.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const checkEmployeePassword = async (email, currentPassword) => {
  const employee = await Employee.findOne({
    where: { email },
  });

  if (!employee) {
    throw {
      status: 404,
      message: "employees not found",
    };
  }

  const isMatch = await bcrypt.compare(currentPassword, employee.password);

  if (!isMatch) {
    throw {
      status: 400,
      message: "Mật khẩu không chính xác",
    };
  }

  return true;
};
module.exports = {
  getEmployeesWithPagination,
  getEmployeeById,
  createEmployee,
  updateEmployeeById,
  deleteEmployeeById,
  checkEmployeePassword,
};

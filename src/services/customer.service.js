const bcrypt = require("bcrypt");
const { Customer, sequelize } = require("../models/index");
const { Op } = require("sequelize");

const getCustomers = async ({ search, page, pageSize }) => {
  try {
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const size = parseInt(pageSize, 10) > 0 ? parseInt(pageSize, 10) : 5;
    const offset = (pageNumber - 1) * size;

    const whereCondition = {
      fullname: {
        [Op.like]: `%${search}%`,
      },
    };

    //  Đếm tổng số khách hàng
    const totalCount = await Customer.count({
      where: whereCondition,
    });

    const totalPages = Math.ceil(totalCount / size);

    //  Lấy danh sách khách hàng phân trang
    const results = await Customer.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit: size,
      offset,
    });

    return {
      results,
      totalCount,
      totalPages,
      currentPage: pageNumber,
    };
  } catch (error) {
    throw error;
  }
};
const getCustomerById = async (id) => {
  const customer = await Customer.findByPk(id);

  if (!customer) {
    throw {
      status: 404,
      message: "Customer not found",
    };
  }

  return customer;
};
const saltRounds = 10;

const createCustomer = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    const { fullname, avatar, email, tel, address, password } = data;

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const customer = await Customer.create(
      {
        fullname,
        avatar,
        email,
        tel,
        address,
        password: hashedPassword,
      },
      { transaction }
    );

    await transaction.commit();

    return customer;
  } catch (error) {
    await transaction.rollback();
    throw {
      status: 500,
      message: "Failed to create customer",
    };
  }
};
const updateCustomerById = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    // Nếu có password → hash
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, saltRounds);
    }

    const [affectedRows] = await Customer.update(
      {
        ...updates,
        updated_at: new Date(),
      },
      {
        where: { id },
        transaction,
      }
    );

    if (affectedRows === 0) {
      throw {
        status: 404,
        message: "Customer not found",
      };
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error.status
      ? error
      : { status: 500, message: "Failed to update customer" };
  }
};
const deleteCustomerById = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const deletedRows = await Customer.destroy({
      where: { id },
      transaction,
    });

    if (deletedRows === 0) {
      throw {
        status: 404,
        message: "Customer not found",
      };
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error.status
      ? error
      : { status: 500, message: "Failed to delete customer" };
  }
};
module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomerById,
  deleteCustomerById,
};

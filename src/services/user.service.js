const { Op } = require("sequelize");
const { User, MembershipCard, sequelize } = require("../models/index");
const bcrypt = require("bcrypt");
const getUsersService = async (filters) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      search,
      searchStatus,
      searchRoleId,
      searchUserType,
      pageNumber,
      limitNumber,
      offset,
    } = filters;

    // WHERE động
    const whereClause = {};

    if (search) {
      whereClause.fullname = { [Op.like]: `%${search}%` };
    }
    if (searchStatus) {
      whereClause.status = { [Op.like]: `%${searchStatus}%` };
    }
    if (searchRoleId) {
      whereClause.role_id = { [Op.like]: `%${searchRoleId}%` };
    }
    if (searchUserType) {
      whereClause.user_type = { [Op.like]: `%${searchUserType}%` };
    }

    // COUNT
    const totalCount = await User.count({
      where: whereClause,
      transaction,
    });

    // FIND
    const users = await User.findAll({
      where: whereClause,
      order: [["id", "DESC"]],
      limit: limitNumber,
      offset,
      transaction,
    });

    await transaction.commit();

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
    };
  } catch (error) {
    await transaction.rollback();
    throw error; // ❗ Service chỉ throw lỗi
  }
};
const getUserByIdService = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findOne({
      where: { id },
      attributes: [
        "id",
        "fullname",
        "username",
        "email",
        "tel",
        "address",
        "avatar",
        "status",
        "user_type",
        "role_id",
        "salary",
      ],
      transaction,
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    throw error; // ❌ service KHÔNG trả response
  }
};
const checkEmailExistsService = async (email) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findOne({
      where: { email },
      transaction,
    });

    await transaction.commit();

    if (user) {
      return {
        exists: true,
        user,
      };
    }

    return {
      exists: false,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const SALT_ROUNDS = 10;

const createUserService = async (userData) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      fullname,
      username,
      avatar,
      email,
      tel,
      address,
      password,
      role_id,
      status,
      user_type,
      salary,
    } = userData;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await User.create(
      {
        fullname,
        username,
        avatar,
        email,
        tel,
        address,
        password: hashedPassword,
        role_id,
        status,
        user_type,
        salary,
      },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const updateUserService = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    // Kiểm tra user tồn tại
    const user = await User.findByPk(id, { transaction });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Nếu có password → hash
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    // Update động (giữ nguyên logic cũ)
    await user.update(updates, { transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const deleteUserService = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    // 1️⃣ Kiểm tra user tồn tại
    const user = await User.findByPk(id, { transaction });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // 2️⃣ Kiểm tra ràng buộc FK (membership_cards)
    const relatedCount = await MembershipCard.count({
      where: { user_id: id },
      transaction,
    });

    if (relatedCount > 0) {
      const error = new Error("Không thể xóa tài khoản");
      error.statusCode = 400;
      throw error;
    }

    // 3️⃣ Xóa user
    await user.destroy({ transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const checkPasswordService = async (email, currentPassword) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findOne({
      where: { email },
      transaction,
    });

    if (!user) {
      const error = new Error("Customer not found");
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      const error = new Error("Mật khẩu không chính xác");
      error.statusCode = 400;
      throw error;
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
module.exports = {
  getUsersService,
  getUserByIdService,
  checkEmailExistsService,
  createUserService,
  updateUserService,
  checkPasswordService,
};

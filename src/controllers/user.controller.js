const userService = require("../services/user.service");

const getUsers = async (req, res) => {
  try {
    let {
      search = "",
      searchStatus = "",
      searchRoleId = "",
      searchUserType = "",
      page = 1,
      limit = 10,
    } = req.query;

    // ✅ VALIDATE
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res
        .status(400)
        .json({ message: "Page must be a positive number" });
    }

    if (isNaN(limitNumber) || limitNumber <= 0) {
      return res
        .status(400)
        .json({ message: "Limit must be a positive number" });
    }

    const offset = (pageNumber - 1) * limitNumber;

    // Gọi service
    const data = await userService.getUsersService({
      search,
      searchStatus,
      searchRoleId,
      searchUserType,
      pageNumber,
      limitNumber,
      offset,
    });

    return res.status(200).json({
      message: "Show list users successfully",
      results: data.users,
      totalCount: data.totalCount,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
      limit: limitNumber,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ VALIDATE
    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    const user = await userService.getUserByIdService(id);

    return res.status(200).json({
      result: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to fetch user",
    });
  }
};
const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ VALIDATE
    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const result = await userService.checkEmailExistsService(email);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Database error:", error);

    return res.status(500).json({
      error: "Database error",
      details: error.message,
    });
  }
};
const createUser = async (req, res) => {
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
    } = req.body;

    // ✅ VALIDATE
    if (
      !user_type ||
      (user_type !== "Nhân Viên" && user_type !== "Khách Hàng")
    ) {
      return res.status(400).json({
        error: "Không đúng định dạng Loại Người Dùng",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: "Password is required",
      });
    }

    await userService.createUserService({
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
    });

    return res.status(201).json({
      message: "Tạo tài khoản thành công",
    });
  } catch (error) {
    console.error("Error creating user:", error);

    return res.status(500).json({
      error: "Lỗi khi tạo tài khoản",
    });
  }
};
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ VALIDATE
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid user id",
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No data provided for update",
      });
    }

    await userService.updateUserService(id, updates);

    return res.status(200).json({
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);

    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to update user",
    });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ VALIDATE
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid user id",
      });
    }

    await userService.deleteUserService(id);

    return res.status(200).json({
      message: "Xóa tài khoản thành công",
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    return res.status(error.statusCode || 500).json({
      error: error.message || "Lỗi khi xóa tài khoản",
    });
  }
};
const checkPassword = async (req, res) => {
  try {
    const { email, currentPassword } = req.body;

    // ✅ VALIDATE
    if (!email || !currentPassword) {
      return res.status(400).json({
        error: "Email and current password are required",
      });
    }

    await userService.checkPasswordService(email, currentPassword);

    return res.status(200).json({
      message: "Password is correct",
    });
  } catch (error) {
    console.error("Error checking password:", error);

    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error",
    });
  }
};
module.exports = {
  getUsers,
  getUserById,
  checkEmailExists,
  createUser,
  updateUser,
  deleteUser,
  checkPassword,
};

// import authAdmin from "../services/auth_admin.service";

import {
  loginEmployeeService,
  forgotPasswordService,
  changePasswordService,
  getPermissionsByUserId,
} from "../services/auth_admin.service";

export const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validate trong controller
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        message: "Email và mật khẩu là bắt buộc",
      });
    }

    const result = await loginEmployeeService({ email, password });

    return res.status(200).json({
      message: "Login successful",
      data: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(error.status || 500).json({
      error: "Login failed",
      message: error.message || "Đăng nhập thất bại",
    });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ Validate trong controller
    if (!email) {
      return res.status(400).json({
        status: 400,
        message: "Email là bắt buộc",
      });
    }

    await forgotPasswordService(email);

    return res.status(200).json({
      status: 200,
      message: "Email đặt lại mật khẩu đã được gửi",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message || "Lỗi khi gửi email đặt lại mật khẩu",
    });
  }
};
export const changePassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // ✅ Validate trong controller
    if (!token || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Token và mật khẩu mới là bắt buộc",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    await changePasswordService({ token, newPassword });

    return res.status(200).json({
      status: "success",
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(error.status || 500).json({
      status: "error",
      message: error.message || "Lỗi khi đổi mật khẩu",
    });
  }
};
export const getRolePermissions = async (req, res) => {
  try {
    const { id } = req.body;

    // ✅ Validate trong controller
    if (!id) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    const permissions = await getPermissionsByUserId(id);

    return res.status(200).json({
      message: "Permissions retrieved successfully",
      data: permissions,
    });
  } catch (error) {
    console.error("Get role permissions error:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Failed to fetch permissions",
    });
  }
};

const authService = require("../services/auth.service");
const test = async (req, res) => {
  return res.status(200).json({
    message: "thành công",
  });
};
const googleLogin = async (req, res) => {
  try {
    const { fullname, email, avatar } = req.body;

    //  Validate tại controller
    // if (!fullname || !email) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "fullname và email là bắt buộc",
    //   });
    // }

    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }

    const data = await authService.googleLogin({
      fullname,
      email,
      avatar,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Google Login Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server",
    });
  }
};
const facebookLogin = async (req, res) => {
  try {
    const { fullname, email, avatar } = req.body;

    //  Validate tại controller
    if (!fullname || !email) {
      return res.status(400).json({
        success: false,
        message: "fullname và email là bắt buộc",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }

    const data = await authService.facebookLogin({
      fullname,
      email,
      avatar,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Facebook Login Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server",
    });
  }
};
const register = async (req, res) => {
  try {
    const { fullname, email, avatar, tel, address, password } = req.body;

    // ===== VALIDATE (viết trực tiếp ở controller theo yêu cầu của bạn) =====
    if (!fullname)
      return res.status(400).json({ message: "Họ và tên là bắt buộc" });
    if (!email) return res.status(400).json({ message: "Email là bắt buộc" });
    if (!tel)
      return res.status(400).json({ message: "Số điện thoại là bắt buộc" });
    if (!address)
      return res.status(400).json({ message: "Địa chỉ là bắt buộc" });
    if (!password)
      return res.status(400).json({ message: "Mật khẩu là bắt buộc" });

    // ===== GỌI SERVICE =====
    await authService.register({
      fullname,
      email,
      avatar,
      tel,
      address,
      password,
    });

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công và cấp thẻ "Mới".',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Lỗi server",
    });
  }
};

const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email ? email.trim().toLowerCase() : "";

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng nhập đầy đủ email và mật khẩu",
      });
    }

    const result = await authService.login({ email, password });

    return res.json({
      status: "success",
      message: "Đăng nhập thành công!",
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Lỗi server",
    });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email là bắt buộc",
      });
    }

    await authService.forgotPassword(email.trim().toLowerCase());

    return res.status(200).json({
      status: "success",
      message: "Email đặt lại mật khẩu đã được gửi",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Lỗi server",
    });
  }
};
const changePassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // ✅ Validate trong controller
    if (!token || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu token hoặc mật khẩu mới",
      });
    }

    await authService.changePassword(token, newPassword);

    return res.status(200).json({
      status: "success",
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Lỗi server",
    });
  }
};

module.exports = {
  googleLogin,
  facebookLogin,
  register,
  login,
  forgotPassword,
  changePassword,
  test,
};

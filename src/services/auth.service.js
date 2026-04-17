const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();

const sendResetPasswordEmail = require("../utils/mailer");
const {
  User,
  MembershipCard,
  MembershipTier,
  sequelize,
} = require("../models/index");

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const DEFAULT_USER_TYPE = "Khách Hàng";

const googleLogin = async ({ fullname, email, avatar }) => {
  try {
    //  Tìm user theo email
    let user = await User.findOne({
      where: { email },
    });

    //  Nếu đã tồn tại → login
    if (user) {
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.fullname,
          avatar: user.avatar,
        },
        JWT_SECRET,
        { expiresIn: "3h" },
      );

      const userJson = user.toJSON();
      delete userJson.password;

      return {
        user: userJson,
        accessToken,
      };
    }

    //  Nếu chưa tồn tại → tạo mới
    user = await User.create({
      fullname,
      email,
      avatar,
      tel: "",
      address: "",
      password: "", // Google login → không dùng password
      user_type: DEFAULT_USER_TYPE,
    });

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.fullname,
      },
      JWT_SECRET,
      { expiresIn: "3h" },
    );

    const userJson = user.toJSON();
    delete userJson.password;

    return {
      user: userJson,
      accessToken,
    };
  } catch (error) {
    console.error("Auth Service Error:", error);
    throw new Error("Không thể đăng nhập bằng Google");
  }
};
const checkEmailExists = async (email) => {
  try {
    const user = await User.findOne({
      where: { email },
    });

    return user;
  } catch (error) {
    throw new Error("Failed to check email");
  }
};

const facebookLogin = async ({ fullname, email, avatar }) => {
  try {
    let user = await User.findOne({ where: { email } });
    if (user) {
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.fullname,
          avatar: user.avatar,
        },
        JWT_SECRET,
        { expiresIn: "3h" },
      );
      // lấy user không có mật khẩu .
      const userJson = user.toJSON();
      delete userJson.password;

      return {
        user: userJson,
        accessToken,
      };
    }
    // nếu chưa có user tạo mới
    user = User.create({
      fullname,
      email,
      avatar,
      tel: "",
      address: "",
      password: "",
      user_type: DEFAULT_USER_TYPE,
    });
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.fullname,
      },
      JWT_SECRET,
      { expiresIn: "3h" },
    );

    const userJson = user.toJSON();
    delete userJson.password;

    return {
      user: userJson,
      accessToken,
    };
  } catch (error) {
    console.log("error", error);
    throw new Error("Không thể đăng nhập bằng Facebook");
  }
};
const register = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    const { fullname, email, avatar, tel, address, password } = data;

    // 1. Check email tồn tại
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error("Email đã tồn tại");
      error.statusCode = 400;
      throw error;
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Tạo user
    const user = await User.create(
      {
        fullname,
        email,
        avatar,
        tel,
        address,
        password: hashedPassword,
        user_type: "Nhân Viên",
      },
      { transaction },
    );

    // 4. Lấy membership tier "Mới"
    const tier = await MembershipTier.findOne({
      where: { name: "Mới" },
    });

    if (!tier) {
      const error = new Error('Không tìm thấy loại thẻ "Mới"');
      error.statusCode = 500;
      throw error;
    }

    // 5. Tạo membership card
    await MembershipCard.create(
      {
        user_id: user.id,
        membership_card_id: tier.id,
        point: 0,
      },
      { transaction },
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const login = async ({ email, password }) => {
  // 1. Tìm user theo email
  const user = await User.findOne({
    where: { email },
  });

  if (!user) {
    const error = new Error(`Không tìm thấy tài khoản với email: ${email}`);
    error.statusCode = 404;
    throw error;
  }

  // 2. So sánh password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Sai mật khẩu, vui lòng thử lại");
    error.statusCode = 401;
    throw error;
  }

  // 3. Tạo JWT
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.fullname,
      avatar: user.avatar,
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  // 4. Remove password
  const userJson = user.toJSON();
  delete userJson.password;

  return {
    user: userJson,
    accessToken: token,
  };
};

const forgotPassword = async (email) => {
  // 1. Tìm user
  const user = await User.findOne({ where: { email } });

  if (!user) {
    const error = new Error("Email không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // 2. Tạo token & expiration
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetTokenExpiration = Date.now() + 2 * 60 * 1000; // 2 phút

  // 3. Update user
  await user.update({
    resetToken,
    resetTokenExpiration,
  });

  // 4. Gửi email
  await sendResetPasswordEmail(email, resetToken);

  return true;
};
const changePassword = async (token, newPassword) => {
  const user = await User.findOne({
    where: {
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    },
  });

  if (!user) {
    const err = new Error("Mã token không hợp lệ hoặc đã hết hạn");
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await user.update({
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiration: null,
  });

  return true;
};

module.exports = {
  googleLogin,
  facebookLogin,
  register,
  login,
  forgotPassword,
  changePassword,
  checkEmailExists,
};

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { User, RolePermission, Permission, sequelize } from "../models/index";

const JWT_SECRET = process.env.JWT_SECRET_KEY;

export const loginEmployeeService = async ({ email, password }) => {
  const transaction = await sequelize.transaction();

  try {
    const userType = "Nhân Viên";

    const employee = await User.findOne({
      where: {
        email,
        user_type: userType,
      },
      transaction,
    });

    if (!employee) {
      throw {
        status: 401,
        message: "Email hoặc mật khẩu không đúng",
      };
    }
    console.log("trước khi ktra mật khẩu ");
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync("123456", salt);
    console.log("matkhau:", hash);
    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      throw {
        status: 401,
        message: "Email hoặc mật khẩu không đúng",
      };
    }

    const expiresIn = 30 * 60; // 30 phút

    const accessToken = jwt.sign({ id: employee.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    await transaction.commit();

    return {
      accessToken,
      expiresIn,
      user: {
        fullname: employee.fullname,
        username: employee.username,
        email: employee.email,
        avatar: employee.avatar,
        tel: employee.tel,
        address: employee.address,
        salary: employee.salary,
        status: employee.status,
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
export const forgotPasswordService = async (email) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Tìm user theo email
    const user = await User.findOne({
      where: { email },
      transaction,
    });

    if (!user) {
      throw {
        status: 404,
        message: "Email không tồn tại",
      };
    }

    // 2. Tạo token reset & thời gian hết hạn (2 phút)
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiration = Date.now() + 2 * 60 * 1000;

    // 3. Cập nhật DB
    await User.update(
      {
        resetToken,
        resetTokenExpiration,
      },
      {
        where: { email },
        transaction,
      }
    );

    // 4. Gửi email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetLink = `http://localhost:5301/forgot?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "[No-reply] - Đặt lại mật khẩu - Nhà hàng Hương Sen",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Đặt lại mật khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
          <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
          <a href="${resetLink}" style="text-decoration: none;">
            <button style="background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px;">
              Đặt lại mật khẩu
            </button>
          </a>
          <p><small>*Liên kết chỉ có hiệu lực trong 2 phút.</small></p>
          <p><small>(Nếu bạn không yêu cầu, vui lòng bỏ qua email này)</small></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    await transaction.commit();

    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
export const changePasswordService = async ({ token, newPassword }) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Tìm user theo token + còn hạn
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiration: {
          [sequelize.Op.gt]: Date.now(),
        },
      },
      transaction,
    });

    if (!user) {
      throw {
        status: 400,
        message: "Mã token không hợp lệ hoặc đã hết hạn",
      };
    }

    // 2. Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Cập nhật mật khẩu + xóa token
    await User.update(
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiration: null,
      },
      {
        where: { id: user.id },
        transaction,
      }
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
export const getPermissionsByUserId = async (userId) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Lấy user → role_id
    const user = await User.findByPk(userId, {
      attributes: ["id", "role_id"],
      transaction,
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const roleId = user.role_id;

    // 2. Lấy permissions theo role
    const permissions = await RolePermission.findAll({
      where: { role_id: roleId },
      include: [
        {
          model: Permission,
        },
      ],
      transaction,
    });

    await transaction.commit();
    return permissions.map((rp) => rp.Permission);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

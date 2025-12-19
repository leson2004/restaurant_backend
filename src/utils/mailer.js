// utils/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendResetPasswordEmail = async (email, token) => {
  const resetLink = `http://localhost:3001/change-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "[No-reply] - Đặt lại mật khẩu - Nhà hàng Hương Sen",
    html: `
       <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
                        <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
                        <a href="${resetLink}" style="text-decoration: none;">
                            <button style="background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
                                Đặt lại mật khẩu
                            </button>
                        </a>
                        <p><small>*Xin lưu ý rằng liên kết này chỉ có hiệu lực trong vòng 2 phút và không được chia sẻ với bất kỳ ai khác.</small></p>
                        <p><small>(Nếu bạn không yêu cầu việc đặt lại mật khẩu, vui lòng bỏ qua email này)</small></p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default sendResetPasswordEmail;

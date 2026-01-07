const { ChangeDish, Reservation } = require("../models");
const nodemailer = require("nodemailer");

const sendChangeDishRequest = async (
  { dishes, dishList, customerInfo, currentTotal, VAT10, discount },
  transaction
) => {
  // 1. Insert changedishes
  for (const dish of dishList) {
    await ChangeDish.create(
      {
        reservation_id: customerInfo.id,
        product_id: dish.product_id,
        quantity: dish.quantity,
        price: dish.price,
        total_amount: currentTotal + VAT10 - discount,
        productName: dish.product_name,
        productImage: dish.product_image,
        taxMoney: VAT10,
        reducedMoney: discount,
      },
      { transaction }
    );
  }

  // 2. Gửi email
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const now = new Date();
  const formattedDateTime = `${now.toLocaleDateString(
    "vi-VN"
  )} lúc ${now.toLocaleTimeString("vi-VN")}`;

  const oldDishListHtml = dishes
    .map(
      (d) =>
        `<li>${d.product_name} - ${d.quantity} x ${formatCurrency(
          d.price
        )}</li>`
    )
    .join("");

  const newDishListHtml = dishList
    .map(
      (d) =>
        `<li>${d.product_name} - ${d.quantity} x ${formatCurrency(
          d.price
        )}</li>`
    )
    .join("");

  const mailCustomer = {
    from: `"Nhà hàng Hương Sen" <${process.env.EMAIL_USERNAME}>`,
    to: customerInfo.email,
    subject: "[No-reply] - Yêu cầu thay đổi món ăn",
    html: `
            <h3>Xin chào ${customerInfo.fullname}</h3>
            <p>Yêu cầu gửi lúc ${formattedDateTime}</p>
            <h4>Món cũ:</h4><ul>${oldDishListHtml}</ul>
            <h4>Món mới:</h4><ul>${newDishListHtml}</ul>
            <p><b>Tổng tiền mới:</b> ${formatCurrency(
              currentTotal + VAT10 - discount
            )}</p>
        `,
  };

  const mailRestaurant = {
    from: `"Nhà hàng Hương Sen" <${process.env.EMAIL_USERNAME}>`,
    to: process.env.EMAIL_EMPLOYYER,
    subject: "[Thông báo] - Khách hàng yêu cầu đổi món",
    html: mailCustomer.html,
  };

  await transporter.sendMail(mailCustomer);
  await transporter.sendMail(mailRestaurant);

  // 3. Update reservation
  await Reservation.update(
    { number_change: 0 },
    { where: { id: customerInfo.id }, transaction }
  );
};

module.exports = {
  sendChangeDishRequest,
};

const axios = require("axios");
const crypto = require("crypto");
const { sequelize, Reservation, Table } = require("../models/index");

const createMomoPayment = async ({
  amount,
  reservationId,
  reservation_code,
}) => {
  const accessKey = process.env.MOMO_ACCESSKEY;
  const secretKey = process.env.MOMO_SECRETKEY;

  const orderInfo = "pay with MoMo";
  const partnerCode = "MOMO";
  const redirectUrl = "http://localhost:3001/confirm";
  const ipnUrl = `${process.env.LOCAL_URL}/api/public/payment/callback`;
  const requestType = "payWithMethod";
  const orderId = reservation_code;
  const requestId = orderId;
  const extraData = "";
  const lang = "vi";

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang,
    requestType,
    autoCapture: true,
    extraData,
    orderGroupId: "",
    signature,
  };

  // 🔹 Gửi request tới MoMo
  const momoResponse = await axios.post(
    "https://test-payment.momo.vn/v2/gateway/api/create",
    requestBody,
    { headers: { "Content-Type": "application/json" } }
  );

  // 🔹 Timeout 1 giờ 40 phút (100 phút)
  setTimeout(async () => {
    const transaction = await sequelize.transaction();
    try {
      const reservation = await Reservation.findByPk(reservationId, {
        transaction,
      });

      if (reservation && reservation.status !== 3) {
        await reservation.update({ status: 2 }, { transaction });
        console.log("Reservation status auto-updated to 2 (timeout)");
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("Timeout status update failed:", error);
    }
  }, 100 * 60000);

  return momoResponse.data;
};
const generateReservationCode = () => {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return `HS${randomNumber}`;
};

const getPayUrl = async ({ amount, reservationId }) => {
  const accessKey = process.env.MOMO_ACCESSKEY;
  const secretKey = process.env.MOMO_SECRETKEY;

  const transaction = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(reservationId, {
      transaction,
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // ❗ GIỮ NGUYÊN LOGIC GỐC: luôn generate mới
    const reservationCode = generateReservationCode();

    await reservation.update(
      { reservation_code: reservationCode },
      { transaction }
    );

    await transaction.commit();

    const orderInfo = "pay with MoMo";
    const partnerCode = "MOMO";
    const redirectUrl = "http://localhost:3001/confirm";
    const ipnUrl = `${process.env.LOCAL_URL}/api/public/payment/callback`;
    const requestType = "payWithMethod";
    const requestId = reservationCode;
    const extraData = "";
    const orderGroupId = "";
    const autoCapture = true;
    const lang = "vi";

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${reservationCode}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const momoResponse = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      {
        partnerCode,
        partnerName: "Test",
        storeId: "MomoTestStore",
        requestId,
        amount,
        orderId: reservationCode,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang,
        requestType,
        autoCapture,
        extraData,
        orderGroupId,
        signature,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return momoResponse.data.payUrl;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const updateReservationStatusByCallback = async (orderId) => {
  const transaction = await sequelize.transaction();

  try {
    // 1️⃣ Lấy reservation (lock)
    const reservation = await Reservation.findOne({
      where: { reservation_code: orderId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    const currentStatus = reservation.status;
    const tableId = reservation.table_id;

    // 2️⃣ Logic nghiệp vụ GIỮ NGUYÊN
    const newStatus = currentStatus === 4 ? 5 : 3;
    const newTableStatus = newStatus === 5 ? 1 : 0;

    // 3️⃣ Update reservation
    await reservation.update({ status: newStatus }, { transaction });

    // 4️⃣ Update table
    await Table.update(
      { status: newTableStatus },
      { where: { id: tableId }, transaction }
    );

    await transaction.commit();

    return {
      reservationStatus: newStatus,
      tableStatus: newTableStatus,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const queryTransactionStatus = async (orderId) => {
  try {
    const accessKey = process.env.MOMO_ACCESSKEY;
    const secretKey = process.env.MOMO_SECRETKEY;

    const rawSignature =
      `accessKey=${accessKey}` +
      `&orderId=${orderId}` +
      `&partnerCode=MOMO` +
      `&requestId=${orderId}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode: "MOMO",
      requestId: orderId,
      orderId,
      signature,
      lang: "vi",
    };

    const result = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/query",
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    return result.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to query transaction status"
    );
  }
};
module.exports = {
  createMomoPayment,
  getPayUrl,
  updateReservationStatusByCallback,
  queryTransactionStatus,
};

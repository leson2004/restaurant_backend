const axios = require("axios");
const crypto = require("crypto");
const {
  sequelize,
  Reservation,
  Table,
  ReservationLog,
} = require("../models/index");

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
    { headers: { "Content-Type": "application/json" } },
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

    const reservationCode = generateReservationCode();

    await reservation.update(
      { reservation_code: reservationCode },
      { transaction },
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
      },
    );

    return momoResponse.data.payUrl;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const createPayBalance = async ({ amount, reservationId }) => {
  const transaction = await sequelize.transaction();

  try {
    // 1️⃣ Lấy reservation
    const reservation = await Reservation.findByPk(reservationId, {
      transaction,
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // 2️⃣ Tạo reservation_code mới (giữ logic cũ)
    const reseCode = generateReservationCode();

    await reservation.update({ reservation_code: reseCode }, { transaction });

    // 3️⃣ Tạo chữ ký MoMo
    const accessKey = process.env.MOMO_ACCESSKEY;
    const secretKey = process.env.MOMO_SECRETKEY;
    const orderInfo = "pay with MoMo";
    const partnerCode = "MOMO";
    const redirectUrl = "http://localhost:5301/reservation";
    const ipnUrl = `${process.env.LOCAL_URL}/api/public/payment/callback`;
    const requestType = "payWithMethod";
    const requestId = reseCode;

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${reseCode}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    // 4️⃣ Gửi request MoMo
    const response = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      {
        partnerCode,
        partnerName: "Test",
        storeId: "MomoTestStore",
        requestId,
        amount,
        orderId: reseCode,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang: "vi",
        requestType,
        autoCapture: true,
        extraData: "",
        signature,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await transaction.commit();

    return {
      payUrl: response.data.payUrl,
    };
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
    // const newTableStatus = newStatus === 5 ? 1 : 0;

    // 3️⃣ Update reservation
    await reservation.update({ status: newStatus }, { transaction });

    // 4️⃣ Update table
    // await Table.update(
    //   { status: newTableStatus },
    //   { where: { id: tableId }, transaction },
    // );

    await transaction.commit();

    return {
      reservationStatus: newStatus,
      // tableStatus: newTableStatus,
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
      { headers: { "Content-Type": "application/json" } },
    );

    return result.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to query transaction status",
    );
  }
};
/**
 * Create deposit payment for a reservation
 * @param {number} reservationId - Reservation ID
 * @param {number} depositAmount - Deposit amount (optional, defaults to reservation deposit field)
 * @param {string} method - "momo" | "vnpay"
 * @param {number} [promotion_id] - Optional promotion ID applied at apply-promotion step
 * @param {number} [totalAmount] - Total after discount (for callback to set reservation.total_amount)
 * @returns {Promise<object>} Payment URL and order ID
 */
const createDepositPayment = async ({
  reservationId,
  depositAmount,
  method,
  promotion_id,
  totalAmount,
}) => {
  const transaction = await sequelize.transaction();
  const { Promotion } = require("../models/index");

  try {
    // Find reservation
    const reservation = await Reservation.findByPk(reservationId, {
      transaction,
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // Check if reservation is in HOLD status
    if (reservation.status !== 0) {
      throw new Error("RESERVATION_NOT_IN_HOLD_STATUS");
    }

    // Check if hold has expired
    const now = new Date();
    if (
      reservation.hold_expired_at &&
      new Date(reservation.hold_expired_at) < now
    ) {
      // Mark as EXPIRED
      await reservation.update({ status: 5 }, { transaction });
      await transaction.commit();
      throw new Error("RESERVATION_EXPIRED");
    }

    // Optional: re-validate promotion if provided (still valid, quantity > 0)
    if (promotion_id) {
      const promotion = await Promotion.findByPk(promotion_id, { transaction });
      if (promotion) {
        const validFrom = new Date(promotion.valid_from);
        const validTo = new Date(promotion.valid_to);
        const qty = parseInt(promotion.quantity, 10);
        if (
          now < validFrom ||
          now > validTo ||
          !Number.isFinite(qty) ||
          qty <= 0
        ) {
          // Don't block payment, just don't pass promotion_id to callback
          promotion_id = null;
        }
      } else {
        promotion_id = null;
      }
    }

    // Use provided depositAmount or reservation.deposit, or calculate from total_amount
    const amount =
      depositAmount || reservation.deposit || reservation.total_amount * 0.3; // Default 30% deposit

    if (!amount || amount <= 0) {
      throw new Error("INVALID_DEPOSIT_AMOUNT");
    }

    // Use reservation_code as orderId for MoMo
    const orderId = reservation.reservation_code;
    const accessKey = process.env.MOMO_ACCESSKEY;
    const secretKey = process.env.MOMO_SECRETKEY;
    const orderInfo = `Deposit for reservation ${orderId}`;
    const partnerCode = "MOMO";
    const redirectUrl = "http://localhost:3001/confirm";
    const ipnUrl = `${process.env.LOCAL_URL}/api/public/payment/momo/callback`;
    const requestType = "payWithMethod";
    const requestId = orderId;
    const extraData = JSON.stringify({
      reservationId: Number(reservationId),
      type: "deposit",
      promotion_id: promotion_id ? Number(promotion_id) : null,
      totalAmount: totalAmount != null ? Number(totalAmount) : null,
    });
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

    // Send request to MoMo
    const momoResponse = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      requestBody,
      { headers: { "Content-Type": "application/json" } },
    );

    // Update reservation with momo_order_id (from response)
    if (momoResponse.data && momoResponse.data.orderId) {
      await reservation.update(
        { momo_order_id: momoResponse.data.orderId },
        { transaction },
      );
    }

    await transaction.commit();

    return {
      payUrl: momoResponse.data.payUrl,
      orderId: orderId,
      amount: amount,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Handle MoMo callback for deposit payment
 * On success: update reservation (total_amount, deposit, promotion_id), decrement promotion.quantity
 * @param {object} callbackData - MoMo callback data (resultCode, orderId, amount, transId, extraData?)
 * @returns {Promise<object>} Updated reservation status
 */
const handleDepositCallback = async (callbackData) => {
  const {
    resultCode,
    orderId,
    amount,
    transId,
    extraData: extraDataRaw,
  } = callbackData;
  const transaction = await sequelize.transaction();
  const { Promotion } = require("../models/index");

  try {
    // Find reservation by reservation_code (orderId)
    const reservation = await Reservation.findOne({
      where: { reservation_code: orderId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    // Success: resultCode === 0
    if (resultCode === 0) {
      let promotionId = null;
      let totalAmount = null;
      try {
        if (extraDataRaw) {
          let raw = extraDataRaw;
          if (typeof raw === "string") {
            try {
              raw = JSON.parse(raw);
            } catch (e) {
              try {
                raw = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
              } catch (_) {}
            }
          }
          if (raw && typeof raw === "object") {
            promotionId =
              raw.promotion_id != null ? Number(raw.promotion_id) : null;
            totalAmount =
              raw.totalAmount != null ? Number(raw.totalAmount) : null;
          }
        }
      } catch (_) {}

      const updatePayload = {
        status: 1, // CONFIRMED
        momo_order_id: transId || orderId,
        deposit: parseFloat(amount) || reservation.deposit,
      };
      if (totalAmount != null && totalAmount >= 0) {
        updatePayload.total_amount = totalAmount;
      }
      if (promotionId) {
        updatePayload.promotion_id = promotionId;
      }

      await reservation.update(updatePayload, { transaction });

      // Decrement promotion quantity when payment success and promotion was applied
      if (promotionId) {
        const promotion = await Promotion.findByPk(promotionId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (promotion && parseInt(promotion.quantity, 10) > 0) {
          await promotion.decrement("quantity", { by: 1, transaction });
        }
      }

      await transaction.commit();

      return {
        success: true,
        reservationId: reservation.id,
        status: 1,
        message: "Deposit payment successful, reservation confirmed",
      };
    }

    // Failure or timeout: Mark as EXPIRED
    // resultCode !== 0 means payment failed, cancelled, or expired
    await reservation.update(
      {
        status: 5, // EXPIRED
      },
      { transaction },
    );

    await transaction.commit();

    return {
      success: false,
      reservationId: reservation.id,
      status: 5,
      message: `Payment failed or expired (code: ${resultCode})`,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Create MOMO payment for completing a CHECKED_IN reservation (final amount).
 * Returns payUrl for redirect; reservation is updated to COMPLETED in handleCompleteCallback.
 * @param {object} params
 * @param {number} params.reservationId
 * @param {number} params.amount - Amount to pay (remainingDue, VND)
 * @param {object} params.extraData - { finalAmount, point_used, special_promotion_id, totalDiscount }
 */
const createCompletePayment = async ({
  reservationId,
  amount,
  extraData: extraPayload,
}) => {
  const reservation = await Reservation.findByPk(reservationId);
  if (!reservation) {
    throw new Error("RESERVATION_NOT_FOUND");
  }
  if (reservation.status !== 2) {
    throw new Error("INVALID_STATUS_MUST_BE_CHECKED_IN");
  }

  const orderId = `${reservation.reservation_code}-F-${Date.now()}`;
  const accessKey = process.env.MOMO_ACCESSKEY;
  const secretKey = process.env.MOMO_SECRETKEY;
  const orderInfo = `Thanh toan don dat ban ${reservation.reservation_code}`;
  const partnerCode = "MOMO";
  const redirectUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/reservation/complete-success`
    : "http://localhost:3001/reservation/complete-success";
  const ipnUrl = `${process.env.LOCAL_URL || "http://localhost:8080"}/api/public/payment/momo/complete/callback`;
  const requestType = "payWithMethod";
  const requestId = orderId;
  const extraData = JSON.stringify({
    type: "complete",
    reservationId: Number(reservationId),
    finalAmount:
      extraPayload?.finalAmount != null ? Number(extraPayload.finalAmount) : 0,
    point_used:
      extraPayload?.point_used != null ? Number(extraPayload.point_used) : 0,
    special_promotion_id:
      extraPayload?.special_promotion_id != null
        ? Number(extraPayload.special_promotion_id)
        : null,
    totalDiscount:
      extraPayload?.totalDiscount != null
        ? Number(extraPayload.totalDiscount)
        : 0,
  });
  const lang = "vi";
  const amountRounded = Math.round(Number(amount));

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amountRounded}` +
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
    amount: amountRounded,
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

  const momoResponse = await axios.post(
    "https://test-payment.momo.vn/v2/gateway/api/create",
    requestBody,
    { headers: { "Content-Type": "application/json" } },
  );

  if (momoResponse.data && momoResponse.data.orderId) {
    await reservation.update({ momo_order_id: momoResponse.data.orderId });
  }

  return {
    payUrl: momoResponse.data.payUrl,
    orderId: momoResponse.data.orderId,
    amount: amountRounded,
  };
};

/**
 * Handle MOMO callback for complete (final) payment.
 * On success: set reservation status=3, total_amount, paid_at, payment_method; deduct points; create log.
 */
const handleCompleteCallback = async (callbackData) => {
  const {
    resultCode,
    orderId,
    amount,
    transId,
    extraData: extraDataRaw,
  } = callbackData;
  const transaction = await sequelize.transaction();
  const ReservationLogModel = sequelize.models.ReservationLog || ReservationLog;

  try {
    let reservationId = null;
    let finalAmount = 0;
    let point_used = 0;
    let special_promotion_id = null;
    let totalDiscount = 0;
    if (extraDataRaw) {
      let raw = extraDataRaw;
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
          try {
            raw = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
          } catch (_) {}
        }
      }
      if (raw && raw.type === "complete" && raw.reservationId) {
        reservationId = Number(raw.reservationId);
        finalAmount = Number(raw.finalAmount) || 0;
        point_used = Number(raw.point_used) || 0;
        special_promotion_id =
          raw.special_promotion_id != null
            ? Number(raw.special_promotion_id)
            : null;
        totalDiscount = Number(raw.totalDiscount) || 0;
      }
    }

    if (!reservationId) {
      await transaction.rollback();
      throw new Error("INVALID_CALLBACK_DATA");
    }

    const reservation = await Reservation.findOne({
      where: { id: reservationId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!reservation) {
      await transaction.rollback();
      throw new Error("RESERVATION_NOT_FOUND");
    }

    if (resultCode === 0) {
      const now = new Date();
      await reservation.update(
        {
          status: 3,
          completed_at: now,
          paid_at: now,
          total_amount: finalAmount,
          payment_method: "momo",
          momo_order_id: transId || orderId,
        },
        { transaction },
      );

      if (reservation.user_id && point_used > 0) {
        const membershipCard = await sequelize.models.MembershipCard?.findOne({
          where: { user_id: reservation.user_id },
          transaction,
        });
        if (membershipCard) {
          const newPoints = Math.max(
            0,
            (membershipCard.point || 0) - Math.floor(point_used / 1000),
          );
          await membershipCard.update({ point: newPoints }, { transaction });
        }
      }

      await ReservationLogModel.create(
        {
          reservation_id: reservationId,
          action: "COMPLETE",
          old_status: 2,
          new_status: 3,
          notes: `Payment=momo, amount=${finalAmount}, discount=${totalDiscount}`,
        },
        { transaction },
      );

      await transaction.commit();
      return {
        success: true,
        reservationId,
        message: "Complete payment successful",
      };
    }

    await transaction.commit();
    return {
      success: false,
      reservationId,
      message: `Payment failed or cancelled (code: ${resultCode})`,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createMomoPayment,
  getPayUrl,
  createPayBalance,
  updateReservationStatusByCallback,
  queryTransactionStatus,
  createDepositPayment,
  handleDepositCallback,
  createCompletePayment,
  handleCompleteCallback,
};

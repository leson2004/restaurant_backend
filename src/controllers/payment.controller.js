const paymentService = require("../services/payment.service");

const createPayment = async (req, res) => {
  try {
    const { amount, reservationId, reservation_code } = req.body;

    // ✅ Validate trong controller
    if (!amount || !reservationId || !reservation_code) {
      return res.status(400).json({
        error: "amount, reservationId and reservation_code are required",
      });
    }

    const result = await paymentService.createMomoPayment({
      amount,
      reservationId,
      reservation_code,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("MoMo payment error:", error);

    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
    });
  }
};
const getPayUrl = async (req, res) => {
  try {
    const { amount, reservationId } = req.body;

    // ✅ Validate trong controller
    if (!amount || !reservationId) {
      return res.status(400).json({
        error: "amount and reservationId are required",
      });
    }

    const payUrl = await paymentService.getPayUrl({
      amount,
      reservationId,
    });

    return res.status(200).json({ payUrl });
  } catch (error) {
    console.error("MoMo getPayUrl error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
    });
  }
};
const payBalance = async (req, res) => {
  try {
    const { amount, reservationId } = req.body;

    // ✅ Validate trong controller
    if (!amount || !reservationId) {
      return res.status(400).json({
        message: "amount and reservationId are required",
      });
    }

    const result = await paymentService.createPayBalance({
      amount,
      reservationId,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("MoMo payment error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};
const momoCallback = async (req, res) => {
  try {
    console.log("MoMo callback:", req.body);

    const { resultCode, orderId } = req.body;

    // ✅ Validate trong controller
    if (typeof resultCode !== "number" || !orderId) {
      return res.status(400).json({ message: "Invalid callback data" });
    }

    if (resultCode === 0) {
      const result =
        await paymentService.updateReservationStatusByCallback(orderId);

      return res.status(200).json({
        message: "Payment success",
        data: result,
      });
    }

    if (resultCode === 49) {
      return res.status(400).json({
        message: "Giao dịch đã hết hạn",
      });
    }

    if (resultCode === 1001) {
      return res.status(400).json({
        message: "Giao dịch bị hủy bởi người dùng",
      });
    }

    return res.status(400).json({
      message: `Giao dịch thất bại (code ${resultCode})`,
    });
  } catch (error) {
    console.error("MoMo callback error:", error.message);
    return res.status(500).json({
      message: error.message || "Server error",
    });
  }
};
const transactionStatus = async (req, res) => {
  try {
    const { orderId } = req.body;

    // ✅ Validate tại controller
    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required",
      });
    }

    const result = await momoService.queryTransactionStatus(orderId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Transaction status error:", error.message);
    return res.status(500).json({
      message: error.message,
    });
  }
};
const createDepositPayment = async (req, res) => {
  try {
    const { reservationId, depositAmount, method, promotion_id, totalAmount } = req.body;

    // ✅ Validate reservation ID
    if (!reservationId) {
      return res.status(400).json({
        error: "reservationId is required",
      });
    }

    const result = await paymentService.createDepositPayment({
      reservationId,
      depositAmount,
      method,
      promotion_id,
      totalAmount,
    });

    return res.status(200).json({
      message: "Deposit payment URL generated successfully",
      payUrl: result.payUrl,
      orderId: result.orderId,
      amount: result.amount,
    });
  } catch (error) {
    console.error("Deposit payment error:", error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    if (error.message === "RESERVATION_NOT_IN_HOLD_STATUS") {
      return res.status(400).json({
        error: "Reservation must be in HOLD status",
      });
    }

    if (error.message === "RESERVATION_EXPIRED") {
      return res.status(400).json({
        error: "Reservation hold has expired",
      });
    }

    if (error.message === "INVALID_DEPOSIT_AMOUNT") {
      return res.status(400).json({
        error: "Invalid deposit amount",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

const momoDepositCallback = async (req, res) => {
  try {
    console.log("MoMo deposit callback:", req.body);

    const { resultCode, orderId, amount, transId, extraData } = req.body;

    // ✅ Validate callback data
    if (typeof resultCode !== "number" || !orderId) {
      return res.status(400).json({
        error: "Invalid callback data",
      });
    }

    // Handle deposit callback (extraData may contain promotion_id, totalAmount)
    const result = await paymentService.handleDepositCallback({
      resultCode,
      orderId,
      amount,
      transId,
      extraData,
    });

    if (result.success) {
      return res.status(200).json({
        message: "Deposit payment successful",
        data: result,
      });
    } else {
      return res.status(200).json({
        message: "Deposit payment failed or expired",
        data: result,
      });
    }
  } catch (error) {
    console.error("MoMo deposit callback error:", error.message);
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
};

const momoCompleteCallback = async (req, res) => {
  try {
    console.log("MoMo complete callback:", req.body);

    const { resultCode, orderId, amount, transId, extraData } = req.body;

    if (typeof resultCode !== "number" || !orderId) {
      return res.status(400).json({ error: "Invalid callback data" });
    }

    const result = await paymentService.handleCompleteCallback({
      resultCode,
      orderId,
      amount,
      transId,
      extraData,
    });

    return res.status(200).json({
      message: result.success ? "Complete payment successful" : "Complete payment failed or cancelled",
      data: result,
    });
  } catch (error) {
    console.error("MoMo complete callback error:", error.message);
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
};

module.exports = {
  createPayment,
  getPayUrl,
  momoCallback,
  transactionStatus,
  payBalance,
  createDepositPayment,
  momoDepositCallback,
  momoCompleteCallback,
};

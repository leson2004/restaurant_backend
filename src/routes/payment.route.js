const express = require("express");
const paymentController = require("../controllers/payment.controller");

let router = express.Router();
router.post("/", paymentController.createPayment);
router.post("/get_pay_url", paymentController.getPayUrl);
router.post("/pay_balance", paymentController.payBalance);
router.post("/callback", paymentController.momoCallback);
router.post("/transaction-status", paymentController.transactionStatus);
// Deposit payment endpoints
router.post("/deposit", paymentController.createDepositPayment);
router.post("/momo/callback", paymentController.momoDepositCallback);
// Complete (final) payment for CHECKED_IN reservation
router.post("/momo/complete/callback", paymentController.momoCompleteCallback);
module.exports = router;

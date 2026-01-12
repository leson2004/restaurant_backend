const express = require("express");
const paymentController = require("../controllers/payment.controller");

let router = express.Router();
router.post("/", paymentController.createPayment);
router.post("/get_pay_url", paymentController.getPayUrl);
router.post("/callback", paymentController.momoCallback);
router.post("/transaction-status", paymentController.transactionStatus);
module.exports = router;

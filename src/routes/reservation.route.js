const express = require("express");
const reservationController = require("../controllers/reservation.controller");

let router = express.Router();

// Luồng mới: chỉ giữ bàn (HOLD) 10 phút, không cần thông tin cá nhân
router.post("/hold", reservationController.holdReservation);
// Update customer information for HOLD reservation
router.put("/:id/customer-info", reservationController.updateCustomerInfo);
// Add or update pre-ordered items for a reservation
router.post("/:id/items", reservationController.addOrUpdateReservationItems);
// Manually cancel a reservation (HOLD or CONFIRMED)
router.post("/:id/cancel", reservationController.cancelReservation);
// Get payment preview (total_amount) by reservation ID
router.get("/:id/payment-preview", reservationController.getPaymentPreview);
// Apply promotion (validate + return totals, no DB update)
router.post("/:id/apply-promotion", reservationController.applyPromotion);
// Get reservation detail by ID (READ-ONLY)
router.get("/:id", reservationController.getReservationById);
module.exports = router;

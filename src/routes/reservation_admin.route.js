const express = require("express");
const reservationAdminController = require("../controllers/reservationAdmin.controller");

let router = express.Router();

// Existing routes
router.post("/changedishes", reservationAdminController.changeDishes);
router.patch("/notChange", reservationAdminController.markReservationNotChange);
router.post("/addTable", reservationAdminController.addTableToReservation);
router.post("/quick-create", reservationAdminController.createAdminReservation);
router.get("/", reservationAdminController.getAllReservations);
router.get("/list", reservationAdminController.getReservationList);
router.get("/timeline", reservationAdminController.getTimeline);
router.get("/myBooking/:user_id", reservationAdminController.getMyBookings);
router.patch(
  "/reservation_ad/:id",
  reservationAdminController.updateReservation,
);
router.patch("/:id", reservationAdminController.patchReservation);
router.delete(
  "/:reservationId/:productId",
  reservationAdminController.deleteReservationDetail,
);
router.get(
  "/existing-reservations",
  reservationAdminController.getExistingReservations,
);
router.get(
  "/reservation_details/:reservation_id",
  reservationAdminController.getReservationDetailsByReservationId,
);
router.post("/", reservationAdminController.createReservation);
router.get("/filter-by-date", reservationAdminController.filterByDate);

// 🆕 HOLD Feature routes
// 1️⃣ GET Detail - với tính toán subtotal, deposit_required, is_hold_expired, remaining_hold_seconds
router.get("/detail/:id", reservationAdminController.getReservationDetail);

// 2️⃣ API THANH TOÁN CỌC
router.post("/:id/pay-deposit", reservationAdminController.payDeposit);

// 2.1️⃣ Check-in endpoint for CONFIRMED reservation
router.post("/:id/check-in", reservationAdminController.checkIn);

// 2.2️⃣ Cancel endpoint for CONFIRMED reservation
router.post("/:id/cancel", reservationAdminController.cancelReservation);

// 3️⃣ API QUẢN LÝ MÓN KHI HOLD
// Update item
router.put(
  "/:id/items/:detailId",
  reservationAdminController.updateReservationItem,
);

// Delete item
router.delete(
  "/:id/items/:detailId",
  reservationAdminController.deleteReservationItem,
);

// Add item
router.post("/:id/items", reservationAdminController.addReservationItem);

// 4️⃣ Change table on CONFIRMED reservation
router.put("/:id/change-table", reservationAdminController.changeTable);

// ============= 🆕 CHECKED_IN (POS) WORKFLOW ROUTES =============

// 1️⃣ Add items to a CONFIRMED or CHECKED_IN reservation
router.post("/:id/add-item", reservationAdminController.addCheckedInItem);

// 2️⃣ Update item in CHECKED_IN reservation
router.put("/:id/update-item", reservationAdminController.updateCheckedInItem);

// 3️⃣ Remove item from CHECKED_IN reservation
router.delete(
  "/:id/remove-item",
  reservationAdminController.removeCheckedInItem,
);

// 4️⃣ Preview bill (no database writes)
router.get("/:id/preview-bill", reservationAdminController.previewBill);

// 5️⃣ Complete CHECKED_IN reservation (finalize payment)
router.post("/:id/complete", reservationAdminController.completeReservation);

// Fix: Check ID before getting by ID (này phải ở cuối để avoid conflict)
router.get("/:id", reservationAdminController.getReservationById);

module.exports = router;

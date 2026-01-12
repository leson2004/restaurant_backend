const express = require("express");
const reservationAdminController = require("../controllers/reservationAdmin.controller");

let router = express.Router();
router.post("/changedishes", reservationAdminController.changeDishes);
router.patch("/notChange", reservationAdminController.markReservationNotChange);
router.post("/addTable", reservationAdminController.addTableToReservation);
// router.get('/',reservationAdminController.)
router.get("/myBooking/:user_id", reservationAdminController.getMyBookings);
router.get("/:id", reservationAdminController.getReservationById);
router.get(
  "/reservation_details/:reservation_id",
  reservationAdminController.getReservationDetailsByReservationId
);
router.patch(
  "/reservation_ad/:id",
  reservationAdminController.updateReservation
);
router.patch("/:id", reservationAdminController.patchReservation);
router.delete(
  "/:reservationId/:productId",
  reservationAdminController.deleteReservationDetail
);
router.get(
  "/existing-reservations",
  reservationAdminController.getExistingReservations
);
router.post("/", reservationAdminController.createReservation);
router.get("/filter-by-date", reservationAdminController.filterByDate);
module.exports = router;

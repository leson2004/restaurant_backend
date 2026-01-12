const express = require("express");
const reservationController = require("../controllers/reservation.controller");

let router = express.Router();
router.get("/", reservationController.getAllTablesWithReservations);
router.get("/:id", reservationController.getTableWithReservationById);
router.post("/", reservationController.createReservation);
router.put("/:id", reservationController.updateReservation);
router.patch("/:id", reservationController.patchReservation);
router.delete("/:id", reservationController.deleteReservation);
module.exports = router;

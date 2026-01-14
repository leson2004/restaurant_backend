const express = require("express");
const reservationDetailController = require("../controllers/reservationDetail.controller");

let router = express.Router();
router.get("/", reservationDetailController.getAllReservationDetails);
router.get("/:id", reservationDetailController.getReservationDetailById);
router.post("/", reservationDetailController.createReservationDetail); //thiếu
router.put("/:id", reservationDetailController.updateReservationDetailById);
router.delete("/:id", reservationDetailController.deleteReservationDetailById);

module.exports = router;

const express = require("express");
const tableController = require("../controllers/table.controller");

let router = express.Router();
router.get("/", tableController.getTables);
router.get("/available", tableController.getAvailableTables);
router.get("/filter-by-date", tableController.filterTablesByDate);
router.post("/", tableController.createTable);
router.put("/:id", tableController.updateTable);
router.patch("/:id", tableController.updateTablePartial);
router.delete("/:id", tableController.deleteTable);
router.get("/:table_id/reservations", tableController.getReservationsByTableId);
module.exports = router;

const express = require("express");
const revenueController = require("../controllers/revenue.controller");

let router = express.Router();
router.get("/", revenueController.getRevenueByYear);
router.get("/revenue", revenueController.getRevenueByDateRange);
module.exports = router;

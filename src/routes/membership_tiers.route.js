const express = require("express");
const membershipTiersController = require("../controllers/membershipTier.controller");

let router = express.Router();
router.get("/", membershipTiersController.getAll);
router.get("/:user_id", membershipTiersController.getMembershipLevel);
module.exports = router;

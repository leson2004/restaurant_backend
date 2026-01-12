const express = require("express");
const membershipCardController = require("../controllers/membershipCard.controller");

let router = express.Router();

router.get("/:user_id", membershipCardController.getMembershipCardByUserId);
module.exports = router;

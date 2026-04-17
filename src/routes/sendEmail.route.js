const express = require("express");
const changeDishController = require("../controllers/changeDish.controller");

let router = express.Router();

router.post("/send", changeDishController.sendChangeDish);

module.exports = router;

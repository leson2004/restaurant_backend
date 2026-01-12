const express = require("express");
const promotionController = require("../controllers/promotion.controller");

let router = express.Router();
router.get("/", promotionController.getAll);
router.get("/:id", promotionController.getById);
router.post("/", promotionController.create);
router.put("/:id", promotionController.update);
router.patch("/:id", promotionController.patch);
router.delete("/:id", promotionController.remove);
module.exports = router;

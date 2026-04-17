const express = require("express");
let router = express.Router();

const chatController = require("../controllers/chat.controller");

router.post("/room", chatController.getOrCreateRoom);
router.get("/messages/:userId", chatController.getMessagesByUser);
router.get("/messages/room/:roomId", chatController.getMessagesByRoom);
router.get("/admin/rooms", chatController.getAdminRooms);

module.exports = router;

const express = require("express");
const userController = require("../controllers/user.controller");

let router = express.Router();
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/check-email-exists", userController.checkEmailExists);
router.post("/", userController.createUser);
router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.post("/check-password", userController.checkPassword);
module.exports = router;

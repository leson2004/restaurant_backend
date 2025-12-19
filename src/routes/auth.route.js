import express from "express";
let router = express.Router();

import authController from "../controllers/auth.controller";

router.post("/google", authController.googleLogin);
router.post("/facebook", authController.facebookLogin);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/change-password", authController.changePassword);
router.get("/test", authController.test);
module.exports = router;

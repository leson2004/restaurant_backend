import express from "express";
let router = express.Router();

import authAdminController from "../controllers/auth_admin.controller";

router.post("/login", authAdminController.login);
router.post("/forgot-password", authAdminController.forgotPassword);
router.post("/change-password", authAdminController.changePassword);
router.get("/role-permission", authAdminController.rolePermission);
module.exports = router;

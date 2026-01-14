import express from "express";
let router = express.Router();

import {
  loginEmployee,
  changePassword,
  getRolePermissions,
  forgotPassword,
} from "../controllers/auth_admin.controller";

router.post("/login", loginEmployee);
router.post("/forgot-password", forgotPassword);
router.post("/change-password", changePassword);
router.post("/role_permissions", getRolePermissions);
module.exports = router;

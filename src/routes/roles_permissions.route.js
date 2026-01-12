const express = require("express");
const rolePermissionController = require("../controllers/rolePermission.controller");

let router = express.Router();
router.get("/", rolePermissionController.getPermissionsByRoleId);
router.get("/:id", rolePermissionController.getRolePermissionByRoleId);
router.post("/", rolePermissionController.addPermissionsToRole);
router.put("/:id", rolePermissionController.updateRolePermissionById);
router.patch("/:id", rolePermissionController.patchRolePermission);
router.delete("/:id", rolePermissionController.deleteRolePermission);
module.exports = router;

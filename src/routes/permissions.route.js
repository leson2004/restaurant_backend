const express = require("express");
const permissionController = require("../controllers/permission.controller");

let router = express.Router();
router.get("/", permissionController.getAllPermissions);
router.get("/:id", permissionController.getPermissionById);
router.post("/", permissionController.createPermission);
router.put("/:id", permissionController.updatePermission);
router.patch("/:id", permissionController.patchPermission);
router.delete("/:id", permissionController.deletePermission);
module.exports = router;

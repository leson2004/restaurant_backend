const express = require("express");
const roleController = require("../controllers/role.controller");

let router = express.Router();
router.get("/", roleController.getAllRoles);
router.get("/:id", roleController.getRoleDetail);
router.post("/", roleController.createRole);
router.put("/:id", roleController.updateRoleFull);
router.patch("/:id", roleController.updateRolePartial);
router.delete("/:id", roleController.deleteRole);
module.exports = router;

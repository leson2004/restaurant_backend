const express = require("express");
const employeeController = require("../controllers/employee.controller");
let router = express.Router();
router.get("/", employeeController.getEmployees);
router.get("/:id", employeeController.getEmployee);
router.post("/", employeeController.createEmployee);
router.patch("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);
router.post("/check-password", employeeController.checkPassword);

module.exports = router;

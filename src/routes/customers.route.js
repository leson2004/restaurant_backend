const express = require("express");
let router = express.Router();

const customerController = require("../controllers/customer.controller");
router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomerById);
router.post("/", customerController.createCustomer);
router.patch("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);
router.post("/check-password", customerController.checkPassword);
module.exports = router;

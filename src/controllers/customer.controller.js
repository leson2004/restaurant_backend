const customerService = require("../services/customer.service");

const getCustomers = async (req, res) => {
  try {
    const { search = "", page = 1, pageSize = 5 } = req.query;

    const data = await customerService.getCustomers({
      search,
      page,
      pageSize,
    });

    return res.status(200).json({
      message: "Show list customer successfully",
      ...data,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);

    return res.status(500).json({
      error: "Failed to fetch customers",
    });
  }
};
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid customer id",
      });
    }

    const customer = await customerService.getCustomerById(id);

    res.status(200).json({
      message: "Show information customer successfully",
      data: customer,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch customer",
    });
  }
};
const createCustomer = async (req, res) => {
  try {
    const { fullname, avatar, email, tel, address, password } = req.body;

    // ✅ Validate trong controller
    if (!fullname) {
      return res.status(400).json({ error: "Fullname is required" });
    }
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!tel) {
      return res.status(400).json({ error: "Tel is required" });
    }
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const customer = await customerService.createCustomer({
      fullname,
      avatar,
      email,
      tel,
      address,
      password,
    });

    res.status(201).json({
      message: "Customer created successfully",
      customerId: customer.id,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to create customer",
    });
  }
};
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ Validate tối thiểu
    if (!id) {
      return res.status(400).json({ error: "Customer id is required" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No data to update" });
    }

    await customerService.updateCustomerById(id, updates);

    res.status(200).json({
      message: "Customer updated successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to update customer",
    });
  }
};
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate
    if (!id) {
      return res.status(400).json({ error: "Customer id is required" });
    }

    await customerService.deleteCustomerById(id);

    res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to delete customer",
    });
  }
};
module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

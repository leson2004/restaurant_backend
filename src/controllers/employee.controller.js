const employeeService = require("../services/employee.service");

const getEmployees = async (req, res) => {
  try {
    let { search = "", page = 1, pageSize = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const sizeNumber = parseInt(pageSize, 10);

    const validPage = pageNumber > 0 ? pageNumber : 1;
    const validSize = sizeNumber > 0 ? sizeNumber : 10;

    const data = await employeeService.getEmployeesWithPagination({
      search,
      page: validPage,
      pageSize: validSize,
    });

    res.status(200).json({
      message: "Show list employees successfully",
      ...data,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch employees",
    });
  }
};
const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate
    if (!id) {
      return res.status(400).json({ error: "Employee id is required" });
    }

    const employee = await employeeService.getEmployeeById(id);

    res.status(200).json(employee);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch employees",
    });
  }
};
const createEmployee = async (req, res) => {
  try {
    const { fullname, avatar, email, tel, address, password, role_id, status } =
      req.body;

    // ✅ Validate
    if (!fullname)
      return res.status(400).json({ error: "Fullname is required" });
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!tel) return res.status(400).json({ error: "Tel is required" });
    if (!address) return res.status(400).json({ error: "Address is required" });
    if (!password)
      return res.status(400).json({ error: "Password is required" });
    if (role_id === undefined)
      return res.status(400).json({ error: "Role is required" });
    if (status === undefined)
      return res.status(400).json({ error: "Status is required" });

    const employee = await employeeService.createEmployee({
      fullname,
      avatar,
      email,
      tel,
      address,
      password,
      role_id,
      status,
    });

    res.status(201).json({
      message: "Thêm nhân viên thành công",
      employeeId: employee.id,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to create employees",
    });
  }
};
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ Validate
    if (!updates.fullname)
      return res.status(400).json({ error: "Fullname is required" });
    if (!updates.email)
      return res.status(400).json({ error: "Email is required" });
    if (!updates.tel) return res.status(400).json({ error: "Tel is required" });
    if (!updates.address)
      return res.status(400).json({ error: "Address is required" });
    if (!updates.password)
      return res.status(400).json({ error: "Password is required" });
    if (updates.role_id === undefined)
      return res.status(400).json({ error: "Role is required" });
    if (updates.status === undefined)
      return res.status(400).json({ error: "Status is required" });

    await employeeService.updateEmployeeById(id, updates);

    res.status(200).json({
      message: "Employee updated successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to update employee",
    });
  }
};
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate tại controller
    if (!id) {
      return res.status(400).json({
        error: "Employee id is required",
      });
    }

    await employeeService.deleteEmployeeById(id);

    return res.status(200).json({
      message: "Employees deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting employees:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Failed to delete employees",
    });
  }
};
const checkPassword = async (req, res) => {
  try {
    const { email, currentPassword } = req.body;

    // ✅ Validate trong controller
    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    if (!currentPassword) {
      return res.status(400).json({
        error: "Current password is required",
      });
    }

    await employeeService.checkEmployeePassword(email, currentPassword);

    return res.status(200).json({
      message: "Password is correct",
    });
  } catch (error) {
    console.error("Error checking password:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  checkPassword,
};

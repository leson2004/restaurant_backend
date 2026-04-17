const tableService = require("../services/table.service");

const getTables = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      searchCapacity = "",
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (pageNumber <= 0 || limitNumber <= 0) {
      return res.status(400).json({
        message: "page và limit phải là số dương",
      });
    }

    const data = await tableService.getTablesService({
      search,
      searchCapacity,
      page: pageNumber,
      limit: limitNumber,
    });

    return res.status(200).json({
      message: "Show list tables successfully",
      ...data,
    });
  } catch (error) {
    console.error("Lỗi controller lấy danh sách bàn:", error);
    return res.status(500).json({
      message: "Failed to fetch tables",
    });
  }
};
const filterTablesByDate = async (req, res) => {
  try {
    const { date, page = 1, limit = 10, searchCapacity = "" } = req.query;

    // if (!date) {
    //   return res.status(400).json({
    //     message: "date là bắt buộc (YYYY-MM-DD)",
    //   });
    // }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (pageNumber <= 0 || limitNumber <= 0) {
      return res.status(400).json({
        message: "page và limit phải là số dương",
      });
    }

    const data = await tableService.filterTablesByDateService({
      date,
      page: pageNumber,
      limit: limitNumber,
      searchCapacity,
    });

    return res.status(200).json({
      message: "Hiển thị danh sách bàn theo ngày thành công",
      ...data,
    });
  } catch (error) {
    console.error("Lỗi controller filter bàn:", error);
    return res.status(500).json({
      message: "Không thể lấy danh sách bàn",
    });
  }
};
const createTable = async (req, res) => {
  try {
    const { number, capacity, status = 1 } = req.body;

    // Validate (number/code có thể là số hoặc chuỗi như "T01")
    if (number === undefined || number === null || String(number).trim() === "") {
      return res.status(400).json({
        message: "Số bàn là bắt buộc",
      });
    }

    if (capacity === undefined || capacity === null || capacity < 0 || capacity > 8) {
      return res.status(400).json({
        message: "Số lượng người không được âm và không được quá 8 người",
      });
    }

    const table = await tableService.createTableService({ number, capacity, status });

    return res.status(201).json({
      message: "Thêm bàn thành công",
      tableId: table.id,
    });
  } catch (error) {
    if (error.code === "DUPLICATE_TABLE") {
      return res.status(409).json({
        message: "Bàn đã tồn tại",
      });
    }

    console.error("Lỗi controller tạo bàn:", error);
    return res.status(500).json({
      message: "Không thể tạo bàn",
    });
  }
};
const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { number, capacity, status } = req.body;

    // Validate
    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "ID bàn không hợp lệ",
      });
    }

    if (number !== undefined && number !== null && String(number).trim() === "") {
      return res.status(400).json({
        message: "Số bàn không được để trống",
      });
    }

    if (capacity !== undefined && (capacity < 0 || capacity > 8)) {
      return res.status(400).json({
        message: "Số lượng người không được âm và không được quá 8 người",
      });
    }

    await tableService.updateTableService({
      id,
      number,
      capacity,
      status,
    });

    return res.status(200).json({
      message: "Cập nhật bàn thành công",
    });
  } catch (error) {
    if (error.code === "TABLE_NOT_FOUND") {
      return res.status(404).json({
        message: "Không tìm thấy bàn",
      });
    }

    if (error.code === "DUPLICATE_TABLE") {
      return res.status(409).json({
        message: "Số bàn đã tồn tại",
      });
    }

    console.error("Lỗi controller cập nhật bàn:", error);
    return res.status(500).json({
      message: "Không thể cập nhật bàn",
    });
  }
};
const updateTablePartial = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ❌ Không cho update rỗng
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "Dữ liệu cập nhật không được để trống",
      });
    }

    // Validate capacity
    if (
      updates.capacity !== undefined &&
      (updates.capacity < 0 || updates.capacity > 8)
    ) {
      return res.status(400).json({
        error: "Số lượng người không được âm và không được quá 8 người",
      });
    }

    // Không cho client tự update updated_at
    delete updates.updated_at;

    await tableService.updatePartialTableById(id, updates);

    return res.status(200).json({
      message: "Cập nhật bàn thành công",
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error("Lỗi khi cập nhật bàn:", error);
    return res.status(500).json({
      error: "Không thể cập nhật bàn",
    });
  }
};
const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    await tableService.deleteTableById(id);

    return res.status(200).json({
      message: "Xóa bàn thành công",
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
      });
    }

    console.error("Lỗi khi xóa bàn:", error);
    return res.status(500).json({
      error: "Không thể xóa bàn",
    });
  }
};
const getReservationsByTableId = async (req, res) => {
  try {
    const { table_id } = req.params;

    if (!table_id || isNaN(table_id)) {
      return res.status(400).json({
        error: "table_id không hợp lệ",
      });
    }

    const reservations =
      await tableService.getReservationsByTableId(table_id);

    return res.status(200).json({
      message: "Hiển thị thông tin đặt bàn thành công",
      data: reservations,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
      });
    }

    console.error("Lỗi khi lấy thông tin đặt bàn:", error);
    return res.status(500).json({
      error: "Không thể lấy thông tin đặt bàn",
    });
  }
};

// Get available tables for a specific date/time range (for admin quick reservation)
const getAvailableTables = async (req, res) => {
  try {
    // Two modes supported:
    // 1) old quick reservation (date, start, end, party_size)
    // 2) new confirmed flow (start_time, end_time, party_size)
    const { date, start, end, party_size } = req.query;
    const { start_time, end_time } = req.query;

    // if new-style params provided use reservationAdmin service
    if (start_time && end_time && party_size) {
      const data = await require("../services/reservationAdmin.service.js").getAvailableTablesService({
        start_time,
        end_time,
        party_size: parseInt(party_size, 10),
      });
      return res.status(200).json(data);
    }

    // otherwise fallback to old behavior
    if (!date || !start || !end || !party_size) {
      return res.status(400).json({
        message: "date, start, end, and party_size are required",
      });
    }

    const { getAvailableTablesService } =
      await import("../services/reservation.service.js");

    const availableTables = await getAvailableTablesService(
      date,
      start,
      end,
      party_size,
    );

    return res.status(200).json(availableTables);
  } catch (error) {
    console.error("Get available tables error:", error);

    // propagate new-style errors first
    if (error.message === "MISSING_PARAMETERS") {
      return res.status(400).json({
        message: "start_time, end_time and party_size are required",
      });
    }

    if (error.message === "MISSING_REQUIRED_FIELDS") {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (error.message === "INVALID_DATE_FORMAT") {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (error.message === "INVALID_TIME_RANGE") {
      return res
        .status(400)
        .json({ message: "Start time must be before end time" });
    }

    if (error.message === "INVALID_PARTY_SIZE") {
      return res.status(400).json({ message: "Invalid party size" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getTables,
  filterTablesByDate,
  createTable,
  updateTable,
  updateTablePartial,
  deleteTable,
  getReservationsByTableId,
  getAvailableTables,
};

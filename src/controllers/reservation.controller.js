import {
  getAllTablesWithReservationsService,
  getTableWithReservationByIdService,
  createReservation,
  updateReservationById,
  patchReservationById,
  deleteReservationById,
} from "../services/reservation.service.js";

export const getAllTablesWithReservations = async (req, res) => {
  try {
    const results = await getAllTablesWithReservationsService();

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching tables:", error);

    return res.status(500).json({
      error: "Failed to fetch tables",
    });
  }
};
export const getTableWithReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ VALIDATE
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid table id",
      });
    }

    const result = await getTableWithReservationByIdService(id);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching table:", error);

    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to fetch table",
    });
  }
};
export const createReservation = async (req, res) => {
  try {
    const { reservation_code, fullname, tel, reservation_date, party_size } =
      req.body;

    // ✅ Validate trong controller
    if (
      !reservation_code ||
      !fullname ||
      !tel ||
      !reservation_date ||
      !party_size
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await createReservation(req.body);

    return res.status(201).json({
      message: "Reservation created successfully",
      reservation_id: result.reservationId,
      table_id: result.tableId,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "NO_AVAILABLE_TABLE") {
      return res.status(400).json({ error: "No available table" });
    }

    if (error.message === "PROMOTION_OUT_OF_STOCK") {
      return res.status(400).json({ error: "Promotion out of stock" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};
export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, tel, reservation_date, party_size, status } = req.body;

    // ✅ Validate trong controller
    if (!id) {
      return res.status(400).json({ error: "Reservation ID is required" });
    }

    if (!fullname || !tel || !reservation_date || !party_size) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await updateReservationById(id, req.body);

    return res.status(200).json({
      message: "Reservation updated successfully",
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    return res.status(500).json({ error: "Failed to update reservation" });
  }
};
export const patchReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ Validate trong controller
    if (!id) {
      return res.status(400).json({ error: "Reservation ID is required" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    await patchReservationById(id, updates);

    return res.status(200).json({
      message: "Reservation updated successfully",
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    return res
      .status(500)
      .json({ error: "Failed to partially update reservation" });
  }
};
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id) {
      return res.status(400).json({ error: "Reservation ID is required" });
    }

    await deleteReservationById(id);

    return res.status(200).json({
      message: "Reservation deleted successfully",
    });
  } catch (error) {
    console.error(error);

    if (error.message === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    return res.status(500).json({
      error: "Failed to delete reservation",
    });
  }
};

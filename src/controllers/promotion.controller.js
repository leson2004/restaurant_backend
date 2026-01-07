const PromotionService = require("../services/promotion.service");

const getAll = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    // ✅ Validate trong controller
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (pageNumber <= 0 || limitNumber <= 0) {
      return res.status(400).json({
        error: "Page and limit must be positive integers",
      });
    }

    const data = await PromotionService.getAllPromotions({
      search,
      page: pageNumber,
      limit: limitNumber,
    });

    return res.status(200).json({
      message: "Show list promotions successfully",
      results: data.results,
      totalCount: data.totalCount,
      totalPages: data.totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch promotions",
    });
  }
};
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid promotion id",
      });
    }

    const promotion = await PromotionService.getPromotionById(id);

    return res.status(200).json({
      message: "Show information promotions successfully",
      data: promotion,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to fetch promotions",
    });
  }
};
const create = async (req, res) => {
  try {
    const { code_name, discount, quantity, valid_from, valid_to, type } =
      req.body;

    // ✅ Validate trong controller
    if (!code_name)
      return res.status(400).json({ error: "Code_name is required" });
    if (!discount)
      return res.status(400).json({ error: "Discount is required" });
    if (!quantity)
      return res.status(400).json({ error: "Quantity is required" });
    if (!valid_from)
      return res.status(400).json({ error: "Valid_from is required" });
    if (!valid_to)
      return res.status(400).json({ error: "Valid_to is required" });
    if (!type) return res.status(400).json({ error: "Type is required" });

    const promotion = await PromotionService.createPromotion({
      code_name,
      discount,
      quantity,
      valid_from,
      valid_to,
      type,
    });

    return res.status(201).json({
      message: "Promotions add new successfully",
      promotionId: promotion.id,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create promotions",
    });
  }
};
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, discount, quantity, valid_from, valid_to } = req.body;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid promotion id" });
    }
    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!discount)
      return res.status(400).json({ error: "Discount is required" });
    if (!quantity)
      return res.status(400).json({ error: "Quantity is required" });
    if (!valid_from)
      return res.status(400).json({ error: "Valid_from is required" });
    if (!valid_to)
      return res.status(400).json({ error: "Valid_to is required" });

    await PromotionService.updatePromotionById(id, {
      name,
      discount,
      quantity,
      valid_from,
      valid_to,
    });

    return res.status(200).json({
      message: "Promotions update successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to update promotions",
    });
  }
};
const patch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid promotion id" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No data provided for update",
      });
    }

    await PromotionService.patchPromotionById(id, updates);

    return res.status(200).json({
      message: "Promotions update successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to partially update promotions",
    });
  }
};
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "Invalid promotion id",
      });
    }

    await PromotionService.deletePromotionById(id);

    return res.status(200).json({
      message: "Promotions deleted successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to delete promotions",
    });
  }
};
module.exports = {
  getAll,
  getById,
  create,
  update,
  patch,
  remove,
};

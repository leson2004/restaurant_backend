const productCategoryService = require("../services/productCategory.service");

const getAllProductCategories = async (req, res) => {
  try {
    const { search = "", searchStatus = "", page = 1, limit = 10 } = req.query;

    // ✅ Validate
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res
        .status(400)
        .json({ message: "Page must be a positive number" });
    }

    if (isNaN(limitNumber) || limitNumber <= 0) {
      return res
        .status(400)
        .json({ message: "Limit must be a positive number" });
    }

    const data = await productCategoryService.getAllProductCategories({
      search,
      searchStatus,
      page: pageNumber,
      limit: limitNumber,
    });

    return res.status(200).json({
      message: "Show list product_categories successfully",
      results: data.results,
      totalCount: data.totalCount,
      totalPages: data.totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
    });
  } catch (error) {
    console.error("Error getAllProductCategories:", error);
    return res.status(500).json({
      message: "Failed to fetch product_categories",
    });
  }
};

const getAllProductCategoriesNoPage = async (req, res) => {
  try {
    const results =
      await productCategoryService.getAllProductCategoriesNoPage();

    return res.status(200).json({
      message: "Show list product categories successfully",
      results,
    });
  } catch (error) {
    console.error("Error getAllProductCategoriesNoPage:", error);
    return res.status(500).json({
      message: "Failed to fetch product categories",
    });
  }
};
const getActiveProductCategories = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    // ✅ Validate
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res.status(400).json({
        message: "Page must be a positive number",
      });
    }

    if (isNaN(limitNumber) || limitNumber <= 0) {
      return res.status(400).json({
        message: "Limit must be a positive number",
      });
    }

    const data = await productCategoryService.getActiveProductCategories({
      search,
      page: pageNumber,
      limit: limitNumber,
    });

    return res.status(200).json({
      message: "Show list product_categories successfully",
      results: data.results,
      totalCount: data.totalCount,
      totalPages: data.totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
    });
  } catch (error) {
    console.error("Error getActiveProductCategories:", error);
    return res.status(500).json({
      message: "Failed to fetch product_categories",
    });
  }
};
const getActiveCategoriesForSelect = async (req, res) => {
  try {
    const { search = "" } = req.query;

    // ✅ Validate đơn giản
    if (typeof search !== "string") {
      return res.status(400).json({
        message: "Search must be a string",
      });
    }

    const results = await productCategoryService.getActiveCategoriesForSelect(
      search
    );

    return res.status(200).json({
      message: "Show list product categories successfully",
      results,
    });
  } catch (error) {
    console.error("Error getActiveCategoriesForSelect:", error);
    return res.status(500).json({
      message: "Failed to fetch product categories",
    });
  }
};
const getProductCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        message: "Invalid category id",
      });
    }

    const category = await productCategoryService.getProductCategoryById(
      categoryId
    );

    return res.status(200).json({
      message: "Show information Category successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error getProductCategoryById:", error);

    if (error.statusCode === 404) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to fetch category",
    });
  }
};
const createProductCategory = async (req, res) => {
  try {
    const { name, status } = req.body;

    // ✅ Validate
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (status === undefined || status === null) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    await productCategoryService.createProductCategory({
      name: name.trim(),
      status,
    });

    return res.status(201).json({
      message: "Category products add new successfully",
    });
  } catch (error) {
    console.error("Error createProductCategory:", error);
    return res.status(500).json({
      message: "Failed to create category",
    });
  }
};
const updateProductCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // ✅ Validate id
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        message: "Invalid category id",
      });
    }

    // ✅ Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    await productCategoryService.updateProductCategoryById(
      categoryId,
      name.trim()
    );

    return res.status(200).json({
      message: "Category products update successfully",
    });
  } catch (error) {
    console.error("Error updateProductCategoryById:", error);

    if (error.statusCode === 404) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update category",
    });
  }
};
const patchProductCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ Validate id
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        message: "Invalid category id",
      });
    }

    // ✅ Validate body
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No data provided for update",
      });
    }

    // ✅ Chỉ cho phép update các field hợp lệ
    const allowedFields = ["name", "status"];
    const filteredUpdates = {};

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update",
      });
    }

    await productCategoryService.patchProductCategoryById(
      categoryId,
      filteredUpdates
    );

    return res.status(200).json({
      message: "Category products update successfully",
    });
  } catch (error) {
    console.error("Error patchProductCategoryById:", error);

    if (error.statusCode === 404) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to partially update category",
    });
  }
};
const deleteProductCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate id
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        message: "Invalid category id",
      });
    }

    await productCategoryService.deleteProductCategoryById(categoryId);

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleteProductCategoryById:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to delete category",
    });
  }
};
module.exports = {
  getAllProductCategories,
  getAllProductCategoriesNoPage,
  getActiveProductCategories,
  getActiveCategoriesForSelect,
  getProductCategoryById,
  createProductCategory,
  updateProductCategoryById,
  patchProductCategoryById,
  deleteProductCategoryById,
};

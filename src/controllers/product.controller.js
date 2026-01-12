const productService = require("../services/product.service");

const getAllProducts = async (req, res) => {
  try {
    let { searchName = "", page = 1, pageSize = 10 } = req.query;

    // ===== Validate =====
    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);

    if (isNaN(page) || page <= 0) {
      return res.status(400).json({
        message: "page must be a positive number",
      });
    }

    if (isNaN(pageSize) || pageSize <= 0) {
      return res.status(400).json({
        message: "pageSize must be a positive number",
      });
    }

    // ===== Call Service =====
    const data = await productService.getAllProducts({
      searchName,
      page,
      pageSize,
    });

    // ===== Response =====
    return res.status(200).json({
      message: "Show list products successfully",
      ...data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
const getActiveProducts = async (req, res) => {
  try {
    let {
      searchName = "",
      searchCateID = "",
      page = 1,
      limit = 10,
    } = req.query;

    // ===== Validate =====
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page <= 0) {
      return res.status(400).json({
        message: "page must be a positive number",
      });
    }

    if (isNaN(limit) || limit <= 0) {
      limit = 10; // giữ đúng logic cũ
    }

    // ===== Call Service =====
    const data = await productService.getActiveProducts({
      searchName,
      searchCateID,
      page,
      limit,
    });

    // ===== Response =====
    return res.status(200).json({
      message: "Show list products successfully",
      ...data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
const getMenuProducts = async (req, res) => {
  try {
    let { search = "" } = req.query;

    // ===== Validate =====
    if (typeof search !== "string") {
      return res.status(400).json({
        message: "search must be a string",
      });
    }

    // ===== Call Service =====
    const results = await productService.getMenuProducts({ search });

    // ===== Response =====
    return res.status(200).json({
      message: "Show menu successfully",
      results,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
const getInactiveProducts = async (req, res) => {
  try {
    let {
      searchName = "",
      searchCateID = "",
      page = 1,
      limit = 10,
    } = req.query;

    // ===== Validate =====
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page <= 0) {
      return res.status(400).json({
        message: "page must be a positive number",
      });
    }

    if (isNaN(limit) || limit <= 0) {
      limit = 10; // giữ logic cũ
    }

    // ===== Call Service =====
    const data = await productService.getInactiveProducts({
      searchName,
      searchCateID,
      page,
      limit,
    });

    // ===== Response =====
    return res.status(200).json({
      message: "Show list products successfully",
      ...data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
const getNewestProducts = async (req, res) => {
  try {
    // Không có input cần validate (logic gốc)

    const results = await productService.getNewestProducts();

    return res.status(200).json({
      message: "Show list of new products successfully",
      results,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // ===== Validate =====
    if (!slug || typeof slug !== "string") {
      return res.status(400).json({
        message: "slug is required",
      });
    }

    // ===== Call Service =====
    const product = await productService.getProductBySlug(slug);

    // ===== Response =====
    return res.status(200).json({
      message: "Show information product successfully",
      data: product,
    });
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
const createProduct = async (req, res) => {
  try {
    const {
      product_code,
      name,
      image,
      price,
      sale_price,
      description,
      status,
      category_id,
    } = req.body;

    // ===== Validate giống logic cũ =====
    if (!product_code) {
      return res.status(400).json({ message: "Product_code is required" });
    }
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }
    if (!price) {
      return res.status(400).json({ message: "Price is required" });
    }
    if (!sale_price) {
      return res.status(400).json({ message: "Sale_price is required" });
    }
    if (status === undefined || status === null) {
      return res.status(400).json({ message: "Status is required" });
    }
    if (!category_id) {
      return res.status(400).json({ message: "Category_id is required" });
    }

    // ===== Call service =====
    await productService.createProduct({
      product_code,
      name,
      image,
      price,
      sale_price,
      description,
      status,
      category_id,
    });

    // ===== Response =====
    return res.status(201).json({
      message: "Products add new successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_code,
      name,
      image,
      price,
      sale_price,
      description,
      status,
      category_id,
    } = req.body;

    // ===== Validate =====
    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    // (Giữ logic gốc: không bắt buộc validate từng field khi update)

    // ===== Call service =====
    await productService.updateProductById(id, {
      product_code,
      name,
      image,
      price,
      sale_price,
      description,
      status,
      category_id,
    });

    // ===== Response =====
    return res.status(200).json({
      message: "Products update successfully",
    });
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "Products not found",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
const patchProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ===== Validate =====
    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No fields provided for update",
      });
    }

    // Không cho phép update id
    if (updates.id) {
      delete updates.id;
    }

    // ===== Call Service =====
    await productService.patchProductById(id, updates);

    // ===== Response =====
    return res.status(200).json({
      message: "Products update successfully",
    });
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "Products not found",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await ProductService.deleteProduct(id);

    return res.status(200).json({
      message: "Products deleted successfully",
    });
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ error: "Products not found" });
    }
    return res.status(500).json({
      error: "Failed to delete products",
    });
  }
};
module.exports = {
  getAllProducts,
  getActiveProducts,
  getMenuProducts,
  getNewestProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
  getInactiveProducts,
};

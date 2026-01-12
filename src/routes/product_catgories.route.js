const express = require("express");
const productCategoriesController = require("../controllers/productCategory.controller");

let router = express.Router();
router.get("/", productCategoriesController.getAllProductCategories);
router.get(
  "/noPage",
  productCategoriesController.getAllProductCategoriesNoPage
);
router.get(
  "/hoat_dong",
  productCategoriesController.getActiveProductCategories
);
router.get(
  "/danh_muc",
  productCategoriesController.getActiveCategoriesForSelect
);
router.get("/:id", productCategoriesController.getProductCategoryById);
router.post("/", productCategoriesController.createProductCategory);
router.put("/:id", productCategoriesController.updateProductCategoryById);
router.patch("/:id", productCategoriesController.patchProductCategoryById);
router.delete("/:id", productCategoriesController.deleteProductCategoryById);

module.exports = router;

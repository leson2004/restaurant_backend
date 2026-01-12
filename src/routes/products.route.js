const express = require("express");
const productController = require("../controllers/product.controller");

let router = express.Router();
router.get("/", productController.getAllProducts);
router.get("/hoat_dong", productController.getActiveProducts);
router.get("/menu", productController.getMenuProducts);
router.get("/ngung_hoat_dong", productController.getInactiveProducts);
router.get("/new", productController.getNewestProducts);
router.get("/slug/:slug", productController.getProductBySlug);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.patch("/:id", productController.patchProduct);
router.delete("/:id", productController.deleteProduct);
module.exports = router;

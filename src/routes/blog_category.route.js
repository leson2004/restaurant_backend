import express from "express";
let router = express.Router();

import blogCategoryController from "../controllers/blogCategory.controller";
router.get("/", blogCategoryController.getAll);
router.get("/:id", blogCategoryController.getById);
router.post("/", blogCategoryController.create);
router.patch("/:id", blogCategoryController.update);
router.delete("/", blogCategoryController.remove);

module.exports = router;

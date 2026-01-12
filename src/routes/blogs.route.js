const express = require("express");
let router = express.Router();

const blogsController = require("../controllers/blogs.controller");

router.get("/", blogsController.getAll);
router.get("/posts", blogsController.getPosts);
router.get("/:id", blogsController.getBlogById);
router.post("/", blogsController.createBlog);
router.put("/:id", blogsController.updateBlog);
router.patch("/:id", blogsController.patchUpdateBlog);
router.get("/slug/:slug", blogsController.getBlogBySlug);
// router.delete("/:id", blogsController.delete);
module.exports = router;

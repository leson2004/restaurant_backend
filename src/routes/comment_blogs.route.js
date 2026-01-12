const express = require("express");
const commentBlogsController = require("../controllers/commentBlog.controller");

let router = express.Router();

router.get("/", commentBlogsController.getComments);
router.get("/blog/:blog_id", commentBlogsController.getCommentsByBlogId);
router.post("/", commentBlogsController.createComment);
router.put("/", commentBlogsController.updateComment);
router.patch("/", commentBlogsController.patchComment);
router.delete("/:id", commentBlogsController.deleteComment);
module.exports = router;

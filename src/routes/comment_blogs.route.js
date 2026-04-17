const express = require("express");
const commentBlogsController = require("../controllers/commentBlog.controller");
const { commentWriteRateLimit } = require("../middlewares/rateLimit.middleware");

const router = express.Router();

router.get("/", commentBlogsController.getComments);
router.get("/blog/:blog_id", commentBlogsController.getCommentsByBlogId);

router.post("/", commentWriteRateLimit, commentBlogsController.createComment);
router.put("/", commentWriteRateLimit, commentBlogsController.updateComment);
router.put("/:id", commentWriteRateLimit, commentBlogsController.updateComment);
router.patch("/", commentWriteRateLimit, commentBlogsController.patchComment);
router.patch("/:id", commentWriteRateLimit, commentBlogsController.patchComment);

router.delete("/:id", commentBlogsController.deleteComment);

module.exports = router;

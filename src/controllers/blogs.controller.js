import blogService from "../services/blogs.service";

const getAll = async (req, res) => {
  try {
    let { searchName = "", page = 1, limit = 10 } = req.query;

    page = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    limit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;

    const result = await blogService.getAllBlogs({
      searchName,
      page,
      limit,
    });

    return res.status(200).json({
      message: "Fetch blogs successfully",
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Failed to fetch blogs",
    });
  }
};
const getPosts = async (req, res) => {
  try {
    let { page = 1, pageSize = 12 } = req.query;

    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);

    // ✅ Validate trong controller
    if (page <= 0 || pageSize <= 0) {
      return res.status(400).json({
        message: "page và pageSize phải lớn hơn 0",
      });
    }

    const data = await blogService.getPostsWithPagination({
      page,
      pageSize,
    });

    return res.status(200).json({
      message: "Hiển thị danh sách bài viết thành công",
      results: data.posts,
      totalCount: data.totalCount,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Không thể lấy danh sách bài viết",
    });
  }
};
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate trong controller
    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "ID blog không hợp lệ",
      });
    }

    const blog = await blogService.getBlogById(id);

    return res.status(200).json(blog);
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to fetch blog",
    });
  }
};
const createBlog = async (req, res) => {
  try {
    const { poster, title, content, author, blog_category_id } = req.body;

    // Validate thủ công
    if (!title || !content || !author) {
      return res.status(400).json({
        error: "Title, content và author là bắt buộc",
      });
    }

    const blog = await BlogService.createBlog({
      poster,
      title,
      content,
      author,
      blog_category_id,
    });

    return res.status(201).json({
      message: "Blog added successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Create blog error:", error);

    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to create blog",
    });
  }
};
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { poster, title, content, author, blog_category_id } = req.body;

    // Validate
    if (!title || !content || !author) {
      return res.status(400).json({
        error: "Title, content và author là bắt buộc",
      });
    }

    const blog = await BlogService.updateBlogById(id, {
      poster,
      title,
      content,
      author,
      blog_category_id,
    });

    return res.status(200).json({
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Update blog error:", error);

    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to update blog",
    });
  }
};
const patchUpdateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "Ít nhất một field cần được cập nhật",
      });
    }

    const blog = await BlogService.patchUpdateBlog(id, updates);

    return res.status(200).json({
      message: "Blog partially updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Patch update blog error:", error);

    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to partially update blog",
    });
  }
};
const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // ✅ Validate trong controller
    if (!slug || slug.trim() === "") {
      return res.status(400).json({
        error: "Slug is required",
      });
    }

    const blog = await blogService.getBlogBySlug(slug);

    return res.status(200).json({
      message: "Show information blog successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error fetching blog by slug:", error);

    return res.status(error.status || 500).json({
      error: error.message || "Failed to fetch blog by slug",
    });
  }
};
export {
  getAll,
  getPosts,
  getBlogById,
  createBlog,
  updateBlog,
  patchUpdateBlog,
  getBlogBySlug,
};

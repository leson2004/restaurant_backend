const { Blog, sequelize } = require("../models/index");
const { Op } = require("sequelize");

const getAllBlogs = async ({ searchName, page, limit }) => {
  try {
    const offset = (page - 1) * limit;

    const whereCondition = {
      [Op.or]: [
        { title: { [Op.like]: `%${searchName}%` } },
        { author: { [Op.like]: `%${searchName}%` } },
      ],
    };

    // count + rows cùng lúc
    const { count, rows } = await Blog.findAndCountAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return {
      results: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
    };
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }
};
const getPostsWithPagination = async ({ page, pageSize }) => {
  const transaction = await sequelize.transaction();

  try {
    const offset = (page - 1) * pageSize;

    // 1. Đếm tổng số bài viết
    const totalCount = await Blog.count({ transaction });

    // 2. Lấy danh sách bài viết
    const posts = await Blog.findAll({
      order: [["created_at", "DESC"]],
      limit: pageSize,
      offset,
      transaction,
    });

    await transaction.commit();

    return {
      posts,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  } catch (error) {
    await transaction.rollback();
    throw error; //  throw để controller xử lý
  }
};
const getBlogById = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const blog = await Blog.findByPk(id, { transaction });

    if (!blog) {
      const error = new Error("Blog not found");
      error.statusCode = 404;
      throw error;
    }

    await transaction.commit();

    return blog;
  } catch (error) {
    await transaction.rollback();
    throw error; // ❗ throw cho controller
  }
};
// create slug
const createSlug = (title) => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};
const createBlog = async (data) => {
  try {
    const { poster, title, content, author, blog_category_id } = data;

    const slug = createSlug(title);

    // Check trùng slug
    const existingBlog = await Blog.findOne({
      where: { slug },
      transaction,
    });

    if (existingBlog) {
      const error = new Error("Slug bài viết đã tồn tại");
      error.statusCode = 409;
      throw error;
    }

    const blog = await Blog.create(
      {
        poster,
        title,
        slug,
        content,
        author,
        blog_category_id,
      },
      { transaction }
    );

    await transaction.commit();
    return blog;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const updateBlogById = async (id, data) => {
  const transaction = await sequelize.transaction();

  try {
    const { poster, title, content, author, blog_category_id } = data;

    // 1. Kiểm tra blog tồn tại
    const blog = await Blog.findByPk(id, { transaction });
    if (!blog) {
      const error = new Error("Blog not found");
      error.statusCode = 404;
      throw error;
    }

    // 2. Tạo slug mới từ title
    const slug = createSlug(title);

    // 3. Kiểm tra slug trùng (ngoại trừ chính nó)
    const slugExists = await Blog.findOne({
      where: {
        slug,
        id: { [sequelize.Sequelize.Op.ne]: id },
      },
      transaction,
    });

    if (slugExists) {
      const error = new Error("Slug bài viết đã tồn tại");
      error.statusCode = 409;
      throw error;
    }

    // 4. Update blog
    await blog.update(
      {
        poster,
        title,
        slug,
        content,
        author,
        blog_category_id,
      },
      { transaction }
    );

    await transaction.commit();
    return blog;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const patchUpdateBlog = async (id, updates) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Kiểm tra blog tồn tại
    const blog = await Blog.findByPk(id, { transaction });
    if (!blog) {
      const error = new Error("Blog not found");
      error.statusCode = 404;
      throw error;
    }

    // 2. Nếu có title → tạo slug mới
    if (updates.title) {
      updates.slug = createSlug(updates.title);

      // 3. Check slug trùng (ngoại trừ chính nó)
      const slugExists = await Blog.findOne({
        where: {
          slug: updates.slug,
          id: { [Op.ne]: id },
        },
        transaction,
      });

      if (slugExists) {
        const error = new Error("Slug bài viết đã tồn tại");
        error.statusCode = 409;
        throw error;
      }
    }

    // 4. Không cho update updated_at từ client
    delete updates.updated_at;

    // 5. Update động
    await blog.update(updates, { transaction });

    await transaction.commit();
    return blog;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
const getBlogBySlug = async (slug) => {
  const transaction = await sequelize.transaction();

  try {
    const blog = await Blog.findOne({
      where: { slug },
      transaction,
    });

    if (!blog) {
      throw {
        status: 404,
        message: "Blog not found",
      };
    }

    await transaction.commit();
    return blog;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
module.exports = {
  getAllBlogs,
  getPostsWithPagination,
  getBlogById,
  createBlog,
  updateBlogById,
  patchUpdateBlog,
  getBlogBySlug,
};

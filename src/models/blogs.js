"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Blog extends Model {
    static associate(models) {
      // Một bài viết thuộc một danh mục bài viết
      Blog.belongsTo(models.BlogCategory, {
        foreignKey: "blog_category_id",
        as: "category",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Blog.hasMany(models.CommentBlog, {
        foreignKey: "blog_id",
      });
    }
  }

  Blog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      poster: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
      author: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      blog_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Blog",
      tableName: "blogs",
      timestamps: false, // vì bạn dùng created_at và updated_at thủ công
    }
  );

  return Blog;
};

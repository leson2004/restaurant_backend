"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CommentBlog extends Model {
    static associate(models) {
      // Bình luận thuộc về một bài viết (Blog)
      CommentBlog.belongsTo(models.Blog, {
        foreignKey: "blog_id",
        as: "blog",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      // Bình luận thuộc về một người dùng (User)
      CommentBlog.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  CommentBlog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      blog_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "CommentBlog",
      tableName: "comment_blog",
      timestamps: false, // vì bạn dùng created_at và updated_at thủ công
    }
  );

  return CommentBlog;
};

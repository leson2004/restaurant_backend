"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BlogCategory extends Model {
    static associate(models) {
      // 1 danh mục có thể có nhiều bài viết
      BlogCategory.hasMany(models.Blog, {
        foreignKey: "blog_category_id",
        as: "blogs",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  }

  BlogCategory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
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
      modelName: "BlogCategory",
      tableName: "blog_categories",
      timestamps: false, // vì bạn tự đặt created_at & updated_at
    }
  );

  return BlogCategory;
};

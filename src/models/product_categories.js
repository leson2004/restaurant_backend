"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductCategory extends Model {
    static associate(models) {
      // 1 danh mục sản phẩm có thể có nhiều sản phẩm
      ProductCategory.hasMany(models.Product, {
        foreignKey: "categories_id", // cột trong bảng products
        as: "products",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  ProductCategory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "createdAt", // khớp với migration
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updatedAt",
      },
    },
    {
      sequelize,
      modelName: "ProductCategory",
      tableName: "product_categories",
      timestamps: true, // vì migration dùng createdAt, updatedAt
    }
  );

  return ProductCategory;
};

"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Một sản phẩm thuộc một danh mục (ProductCategory)
      Product.belongsTo(models.ProductCategory, {
        foreignKey: "categories_id",
        as: "category",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      // Một sản phẩm có thể xuất hiện trong nhiều chi tiết đặt bàn (reservation_details)
      Product.hasMany(models.ReservationDetail, {
        foreignKey: "product_id",
        as: "reservation_details",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      product_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      sale_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "Không có mô tả",
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1, // 1: hiển thị, 0: ẩn
      },
      categories_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      modelName: "Product",
      tableName: "products",
      timestamps: false, // vì bạn đã dùng created_at và updated_at thủ công
    }
  );

  return Product;
};

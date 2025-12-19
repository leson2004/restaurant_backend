"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ReservationDetail extends Model {
    static associate(models) {
      // Mỗi chi tiết thuộc về 1 đơn đặt bàn
      ReservationDetail.belongsTo(models.Reservation, {
        foreignKey: "reservation_id",
        as: "reservation",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      // Mỗi chi tiết liên kết với 1 sản phẩm
      ReservationDetail.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  ReservationDetail.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      reservation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      productName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      productImage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      taxMoney: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      reducedMoney: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "ReservationDetail",
      tableName: "reservation_details",
      timestamps: false, // không có created_at, updated_at
    }
  );

  return ReservationDetail;
};

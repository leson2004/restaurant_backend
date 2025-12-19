"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ReservationDetail extends Model {
    static associate(models) {
      // Một chi tiết đặt bàn thuộc về một đơn đặt bàn
      ReservationDetail.belongsTo(models.Reservation, {
        foreignKey: "reservation_id",
        as: "reservation",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      // Một chi tiết đặt bàn thuộc về một sản phẩm
      ReservationDetail.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  ReservationDetail.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "createdAt",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updatedAt",
      },
    },
    {
      sequelize,
      modelName: "ReservationDetail",
      tableName: "reservation_details",
      timestamps: true, // vì bạn có createdAt, updatedAt
    }
  );

  return ReservationDetail;
};

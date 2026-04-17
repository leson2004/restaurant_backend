"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Promotion extends Model {
    static associate(models) {
      //Một khuyến mãi có thể được áp dụng cho nhiều đơn đặt bàn (reservations)
      Promotion.hasMany(models.Reservation, {
        foreignKey: "promotion_id",
        // as: "reservations",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  Promotion.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      code_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      type: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0, // 0: mã thường, 1:mã đặc biệt
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      valid_from: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      valid_to: {
        type: DataTypes.DATE,
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
      modelName: "Promotion",
      tableName: "promotions",
      timestamps: false, // vì bạn đã dùng created_at và updated_at thủ công
    },
  );

  return Promotion;
};

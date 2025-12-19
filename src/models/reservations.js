"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    static associate(models) {
      // Một đơn đặt bàn thuộc về 1 user
      Reservation.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      // Một đơn đặt bàn thuộc về 1 bàn (table)
      Reservation.belongsTo(models.Table, {
        foreignKey: "table_id",
        as: "table",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      // Một đơn đặt bàn có thể gắn 1 khuyến mãi
      Reservation.belongsTo(models.Promotion, {
        foreignKey: "promotion_id",
        as: "promotion",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      // Một đơn đặt bàn có thể chứa nhiều chi tiết món ăn
      Reservation.hasMany(models.ReservationDetail, {
        foreignKey: "reservation_id",
        as: "details",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  Reservation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      reservation_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      number_change: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      table_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      promotion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fullname: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      tel: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      reservation_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      party_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      deposit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1, // 1: chờ xác nhận, 2: đã xác nhận, 3: hoàn thành, 4: hủy
      },
      momo_order_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
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
      modelName: "Reservation",
      tableName: "reservations",
      timestamps: false, // vì bạn dùng created_at và updated_at thủ công
    }
  );

  return Reservation;
};

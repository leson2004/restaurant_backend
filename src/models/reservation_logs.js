"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ReservationLog extends Model {
    static associate(models) {
      // Một log ghi lại hành động của một đặt bàn
      ReservationLog.belongsTo(models.Reservation, {
        foreignKey: "reservation_id",
        as: "reservation",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  ReservationLog.init(
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
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "PAY_DEPOSIT, CANCEL, CHANGE_ITEMS, etc.",
      },
      old_status: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
      new_status: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
      old_deposit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      new_deposit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "CASH, BANK, MOMO, ZALOPAY",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ReservationLog",
      tableName: "reservation_logs",
      timestamps: true,
    },
  );

  return ReservationLog;
};

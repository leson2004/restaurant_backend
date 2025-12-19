"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Table extends Model {
    static associate(models) {
      // Một bàn có thể có nhiều đơn đặt bàn (reservations)
      Table.hasMany(models.Reservation, {
        foreignKey: "table_id",
        as: "reservations",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  Table.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0, // 0 = trống, 1 = đang phục vụ
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
      modelName: "Table",
      tableName: "tables",
      timestamps: false, // vì bạn đã dùng created_at và updated_at thủ công
    }
  );

  return Table;
};

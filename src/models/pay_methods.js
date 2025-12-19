"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PayMethod extends Model {
    static associate(models) {
      // Một phương thức thanh toán thuộc về một đơn đặt bàn (Reservation)
      PayMethod.belongsTo(models.Reservation, {
        foreignKey: "reservation_id",
        as: "reservation",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      // Một phương thức thanh toán được thực hiện bởi một người dùng (User)
      PayMethod.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  PayMethod.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      reservation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      method: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
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
      modelName: "PayMethod",
      tableName: "pay_methods",
      timestamps: false, // vì bạn đang dùng created_at và updated_at thủ công
    }
  );

  return PayMethod;
};

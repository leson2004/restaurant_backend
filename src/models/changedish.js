"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChangeDish extends Model {
    static associate(models) {
      // Liên kết với Reservation
      ChangeDish.belongsTo(models.Reservation, {
        foreignKey: "reservation_id",
        // as: "reservation",
      });

      // Liên kết với Product
      ChangeDish.belongsTo(models.Product, {
        foreignKey: "product_id",
        // as: "product",
      });
    }
  }

  ChangeDish.init(
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
        type: DataTypes.STRING,
        allowNull: false,
      },

      productImage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      taxMoney: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },

      reducedMoney: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "ChangeDish",
      tableName: "changedishes",
    }
  );

  return ChangeDish;
};

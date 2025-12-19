"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Một user có thể thuộc 1 vai trò (Role)
      User.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      // Một user có thể có nhiều đơn đặt bàn (Reservations)
      User.hasMany(models.Reservation, {
        foreignKey: "user_id",
        as: "reservations",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fullname: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: true, //
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      tel: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      user_type: {
        type: DataTypes.ENUM("Khách Hàng", "Nhân Viên"),
        defaultValue: "Khách Hàng",
      },
      salary: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      resetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      resetTokenExpiration: {
        type: DataTypes.BIGINT,
        allowNull: true,
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
      modelName: "User",
      tableName: "users",
      timestamps: false, // vì bạn dùng created_at và updated_at thủ công
    }
  );

  return User;
};

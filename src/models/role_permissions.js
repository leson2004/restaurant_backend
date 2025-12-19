"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    static associate(models) {
      // Bảng trung gian, nên chỉ cần khai báo belongsTo để hỗ trợ truy vấn ngược
      RolePermission.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      RolePermission.belongsTo(models.Permission, {
        foreignKey: "permission_id",
        as: "permission",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  RolePermission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      permission_id: {
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
      modelName: "RolePermission",
      tableName: "role_permissions",
      timestamps: false, // vì bạn đã có created_at, updated_at
    }
  );

  return RolePermission;
};

"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      // Nhiều Permission có thể thuộc về nhiều Role (quan hệ N-N)
      Permission.belongsToMany(models.Role, {
        through: "role_permissions", // bảng trung gian
        foreignKey: "permission_id", // khóa ngoại trỏ về permission
        otherKey: "role_id", // khóa ngoại trỏ về role
        // as: "roles", // alias để gọi trong include
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  Permission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      label: {
        type: DataTypes.STRING(255),
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
      modelName: "Permission",
      tableName: "permissions",
      underscored: true, // dùng kiểu created_at thay vì createdAt
      timestamps: false, // bạn đã tạo thủ công created_at, updated_at
    }
  );

  return Permission;
};

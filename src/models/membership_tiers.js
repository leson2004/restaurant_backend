"use strict";

module.exports = (sequelize, DataTypes) => {
  const MembershipTier = sequelize.define(
    "MembershipTier",
    {
      name: DataTypes.STRING,
      point: DataTypes.INTEGER,
      description: DataTypes.TEXT,
    },
    {
      tableName: "membership_tiers",
      underscored: true,
    }
  );

  MembershipTier.associate = function (models) {
    MembershipTier.hasMany(models.MembershipCard, {
      foreignKey: "membership_card_id",
    });
  };

  return MembershipTier;
};
("use strict");
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MembershipTier extends Model {
    static associate(models) {
      // Ví dụ: 1 hạng thành viên có thể có nhiều user
      MembershipTier.hasMany(models.MembershipCard, {
        foreignKey: "membership_card_id", // nếu bạn có cột này trong bảng users
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  MembershipTier.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      point: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
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
      modelName: "MembershipTier",
      tableName: "membership_tiers",
      timestamps: false, // vì bạn dùng created_at và updated_at thủ công
    }
  );

  return MembershipTier;
};

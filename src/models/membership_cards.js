"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MembershipCard extends Model {
    static associate(models) {
      // Một thẻ thành viên thuộc về 1 user
      MembershipCard.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      // Một thẻ thành viên liên kết với 1 hạng thành viên
      MembershipCard.belongsTo(models.MembershipTier, {
        foreignKey: "membership_card_id",
        as: "tier",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  MembershipCard.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      membership_card_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      point: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      modelName: "MembershipCard",
      tableName: "membership_cards",
      timestamps: false, // vì bạn đang dùng created_at và updated_at thủ công
    }
  );

  return MembershipCard;
};

"use strict";
module.exports = (sequelize, DataTypes) => {
  const ChatRoom = sequelize.define(
    "ChatRoom",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("open", "closed"),
        defaultValue: "open",
      },

      last_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      last_message_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "chat_rooms",
      timestamps: false,
      underscored: true,
    }
  );

  ChatRoom.associate = (models) => {
    ChatRoom.hasMany(models.ChatMessage, {
      foreignKey: "room_id",
      as: "messages",
    });

    ChatRoom.belongsTo(models.User, {
      foreignKey: "customer_id",
      as: "customer",
    });

    ChatRoom.belongsTo(models.User, {
      foreignKey: "admin_id",
      as: "admin",
    });
  };

  return ChatRoom;
};

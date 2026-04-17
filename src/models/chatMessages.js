"use strict";
module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define(
    "ChatMessage",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      sender_role: {
        type: DataTypes.ENUM("customer", "admin", "bot"),
        allowNull: false,
      },

      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        comment:
          "Bot rich reply: { images: string[], link: { url, label } }. Stored for history.",
      },

      status: {
        type: DataTypes.ENUM("sending", "sent", "seen"),
        defaultValue: "sent",
      },
    },
    {
      tableName: "chat_messages",
      timestamps: false,
      underscored: true,
    }
  );

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.ChatRoom, {
      foreignKey: "room_id",
      as: "room",
    });
  };

  return ChatMessage;
};

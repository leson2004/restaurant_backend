"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("chat_messages", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "chat_rooms",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      sender_role: {
        type: Sequelize.ENUM("customer", "admin", "bot"),
        allowNull: false,
      },

      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("sending", "sent", "seen"),
        defaultValue: "sent",
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("chat_messages");
  },
};

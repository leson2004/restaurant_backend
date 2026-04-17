"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "chat_messages",
      "attachments",
      {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Bot rich reply: { images: string[], link: { url, label } }",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("chat_messages", "attachments");
  },
};

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm cột toxicity_score
    await queryInterface.addColumn("comment_blog", "toxicity_score", {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
    });

    // Thêm cột moderation_status (ENUM)
    await queryInterface.addColumn("comment_blog", "moderation_status", {
      type: Sequelize.ENUM("approved", "hidden", "rejected"),
      defaultValue: "approved",
      allowNull: false,
    });

    // Thêm cột moderation_reason
    await queryInterface.addColumn("comment_blog", "moderation_reason", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Thêm cột is_deleted
    await queryInterface.addColumn("comment_blog", "is_deleted", {
      type: Sequelize.TINYINT,
      defaultValue: 0,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Xóa các cột khi rollback
    await queryInterface.removeColumn("comment_blog", "is_deleted");
    await queryInterface.removeColumn("comment_blog", "moderation_reason");
    await queryInterface.removeColumn("comment_blog", "moderation_status");
    await queryInterface.removeColumn("comment_blog", "toxicity_score");
  },
};

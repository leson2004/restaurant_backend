"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("reservations", "promotion_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "promotions",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      after: "table_id", // optional (MySQL only)
    });

    // index để query nhanh
    await queryInterface.addIndex("reservations", ["promotion_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("reservations", "promotion_id");
  },
};

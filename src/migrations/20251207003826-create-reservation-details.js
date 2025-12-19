"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservation_details", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      reservation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "reservations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      price: { type: Sequelize.FLOAT, allowNull: false },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("reservation_details");
  },
};

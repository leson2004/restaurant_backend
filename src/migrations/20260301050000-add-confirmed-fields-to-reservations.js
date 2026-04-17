"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("reservations", "paid_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("reservations", "payment_method", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn("reservations", "cancelled_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("reservations", "refund_type", {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: "FULL|HALF|NONE",
    });

    await queryInterface.addColumn("reservations", "refund_amount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn("reservations", "refund_status", {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: "PENDING",
    });

    await queryInterface.addColumn("reservations", "table_changed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("reservations", "paid_at");
    await queryInterface.removeColumn("reservations", "payment_method");
    await queryInterface.removeColumn("reservations", "cancelled_at");
    await queryInterface.removeColumn("reservations", "refund_type");
    await queryInterface.removeColumn("reservations", "refund_amount");
    await queryInterface.removeColumn("reservations", "refund_status");
    await queryInterface.removeColumn("reservations", "table_changed_at");
  },
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservations", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      reservation_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      number_change: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      table_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tables",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      promotion_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "promotions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      fullname: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      tel: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      reservation_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      party_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      deposit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1, // 1: chờ xác nhận, 2: đã xác nhận, 3: hoàn thành, 4: hủy
      },
      momo_order_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("reservations");
  },
};

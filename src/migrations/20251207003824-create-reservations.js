"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservations", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      reservation_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      table_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "tables", key: "id" },
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

      party_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      /** ⏰ Thời gian dùng bàn */
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      /** ⏳ giữ bàn 10 phút */
      hold_expired_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      /** 📌 loại đặt bàn */
      reservation_type: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: "0=ONLINE,1=WALK_IN",
      },

      /** 💰 tiền */
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      deposit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      /** 🧾 trạng thái vận hành */
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment:
          "0=HOLD,1=CONFIRMED,2=CHECKED_IN,3=COMPLETED,4=CANCELED,5=EXPIRED",
      },

      checked_in_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      momo_order_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    /** 🔥 Index cực kỳ quan trọng */
    await queryInterface.addIndex("reservations", [
      "table_id",
      "start_time",
      "end_time",
      "status",
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("reservations");
  },
};

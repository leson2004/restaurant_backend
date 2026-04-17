"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // membership_tiers
    await queryInterface.addColumn("membership_tiers", "min_spending", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("membership_tiers", "earn_rate", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("membership_tiers", "discount_rate", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });

    // membership_cards
    await queryInterface.addColumn("membership_cards", "reward_points", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("membership_cards", "total_spending", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // rename foreign key column
    await queryInterface.renameColumn(
      "membership_cards",
      "membership_card_id",
      "membership_tier_id",
    );

    // rename "point" -> "reward_points" (nếu vẫn còn cột cũ)
    try {
      await queryInterface.removeColumn("membership_cards", "point");
    } catch (err) {
      console.log("Column 'point' không tồn tại, bỏ qua");
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("membership_tiers", "min_spending");
    await queryInterface.removeColumn("membership_tiers", "earn_rate");
    await queryInterface.removeColumn("membership_tiers", "discount_rate");

    await queryInterface.removeColumn("membership_cards", "reward_points");
    await queryInterface.removeColumn("membership_cards", "total_spending");

    await queryInterface.renameColumn(
      "membership_cards",
      "membership_tier_id",
      "membership_card_id",
    );
  },
};

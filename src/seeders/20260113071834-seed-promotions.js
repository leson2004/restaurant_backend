"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "promotions",
      [
        {
          code_name: "HV10",
          discount: 10,
          type: 0, // 0 = %, giảm 10%
          quantity: 100,
          valid_from: new Date("2025-01-01"),
          valid_to: new Date("2025-12-31"),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          code_name: "HV20",
          discount: 20,
          type: 0, // 0 = %
          quantity: 50,
          valid_from: new Date("2025-01-01"),
          valid_to: new Date("2025-06-30"),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          code_name: "TET50K",
          discount: 50000,
          type: 1, // 1 = tiền mặt
          quantity: 200,
          valid_from: new Date("2025-01-20"),
          valid_to: new Date("2025-02-10"),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          code_name: "VIP100K",
          discount: 100000,
          type: 1,
          quantity: 30,
          valid_from: new Date("2025-01-01"),
          valid_to: new Date("2025-12-31"),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("promotions", null, {});
  },
};

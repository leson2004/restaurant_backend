"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "tables",
      [
        {
          number: 1,
          capacity: 2,
          status: 0, // trống
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          number: 2,
          capacity: 4,
          status: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          number: 3,
          capacity: 4,
          status: 0, // đang phục vụ
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          number: 4,
          capacity: 6,
          status: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          number: 5,
          capacity: 8,
          status: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("tables", null, {});
  },
};

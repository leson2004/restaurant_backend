"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Xóa dữ liệu cũ để tránh trùng và đảm bảo đúng schema
    await queryInterface.bulkDelete("tables", null, {});

    await queryInterface.bulkInsert("tables", [
      {
        code: "T01",
        capacity: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        code: "T02",
        capacity: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        code: "T03",
        capacity: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        code: "T04",
        capacity: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        code: "T05",
        capacity: 6,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        code: "T06",
        capacity: 6,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        code: "T07",
        capacity: 8,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        code: "T08",
        capacity: 10,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("tables", null, {});
  },
};

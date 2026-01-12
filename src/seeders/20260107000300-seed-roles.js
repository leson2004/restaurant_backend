"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("roles", [
      {
        id: 1,
        name: "Admin",
        description: "Quản trị hệ thống nhà hàng",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: "Nhân viên",
        description: "Nhân viên quản lý đặt bàn & khách hàng",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: "Khách hàng",
        description: "Khách hàng đặt bàn",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};

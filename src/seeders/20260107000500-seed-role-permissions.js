"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("role_permissions", [
      // Admin có tất cả quyền
      {
        role_id: 1,
        permission_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: 1,
        permission_id: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: 1,
        permission_id: 3,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: 1,
        permission_id: 4,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Nhân viên
      {
        role_id: 2,
        permission_id: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_id: 2,
        permission_id: 3,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Khách hàng (chỉ xem / đặt bàn → không cần permission)
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("role_permissions", null, {});
  },
};

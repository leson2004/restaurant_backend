"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("permissions", [
      {
        id: 1,
        title: "Quản lý người dùng",
        name: "manage_users",
        label: "Thêm / sửa / xóa người dùng",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        title: "Quản lý đặt bàn",
        name: "manage_reservations",
        label: "Xem và xử lý đơn đặt bàn",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        title: "Quản lý bài viết",
        name: "manage_blogs",
        label: "CRUD bài viết nhà hàng",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        title: "Xem báo cáo",
        name: "view_reports",
        label: "Xem thống kê & báo cáo",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("permissions", null, {});
  },
};

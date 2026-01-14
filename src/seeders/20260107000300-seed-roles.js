"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Xóa dữ liệu cũ để tránh trùng ID
    await queryInterface.bulkDelete("roles", null, {});

    await queryInterface.bulkInsert("roles", [
      {
        id: 1,
        name: "Quản trị viên",
        permissions: null,
        description: "Không có mô tả",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: "Quản trị sản phẩm",
        permissions: null,
        description: "Không có mô tả",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        name: "Quản trị danh mục sản phẩm",
        permissions: null,
        description: "Không có mô tả",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 8,
        name: "CHỦ NHÀ HÀNG",
        permissions: null,
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 9,
        name: "Tư vấn viên",
        permissions: null,
        description: null,
        created_at: "2024-10-30 13:55:32",
        updated_at: "2024-10-30 13:55:32",
      },
      {
        id: 10,
        name: "Super Admin",
        permissions: null,
        description: "Đây là Admin có quyền hạn cao nhất",
        created_at: "2024-11-11 16:02:04",
        updated_at: "2024-11-11 16:02:04",
      },
      {
        id: 11,
        name: "Nhân Viên",
        permissions: null,
        description: null,
        created_at: "2024-11-15 13:55:59",
        updated_at: "2024-11-15 13:55:59",
      },
      {
        id: 12,
        name: "Nhân viên tư nhân tư vấn",
        permissions: null,
        description: "Chức năng này để cho nhân viên chỉ để tư vấn cho khách",
        created_at: "2024-11-28 10:24:17",
        updated_at: "2024-12-03 09:35:12",
      },
      {
        id: 13,
        name: "Nhân viên 3",
        permissions: null,
        description: null,
        created_at: "2024-11-28 12:43:57",
        updated_at: "2024-12-03 09:30:55",
      },
      {
        id: 14,
        name: "Quản lý bài viết",
        permissions: null,
        description: "Quản lý bài viết nội dung bài viết",
        created_at: "2025-03-29 22:16:18",
        updated_at: "2025-03-29 22:16:18",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};

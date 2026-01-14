"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("permissions", [
      // ===== QUẢN LÝ SẢN PHẨM =====
      {
        id: 1,
        title: "Quản lý sản phẩm",
        name: "Thêm sản phẩm",
        label: "Thêm",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        title: "Quản lý sản phẩm",
        name: "Sửa sản phẩm",
        label: "Sửa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        title: "Quản lý sản phẩm",
        name: "Xóa sản phẩm",
        label: "Xóa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        title: "Quản lý sản phẩm",
        name: "Xem sản phẩm",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 5,
        title: "Quản lý sản phẩm",
        name: "Khôi phục sản phẩm",
        label: "Khôi phục",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== DANH MỤC SẢN PHẨM =====
      {
        id: 6,
        title: "Quản lý danh mục sản phẩm",
        name: "Thêm danh mục sản phẩm",
        label: "Thêm",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 7,
        title: "Quản lý danh mục sản phẩm",
        name: "Sửa danh mục sản phẩm",
        label: "Sửa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 8,
        title: "Quản lý danh mục sản phẩm",
        name: "Xóa danh mục sản phẩm",
        label: "Xóa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 9,
        title: "Quản lý danh mục sản phẩm",
        name: "Xem danh mục sản phẩm",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 10,
        title: "Quản lý danh mục sản phẩm",
        name: "Khôi phục danh mục sản phẩm",
        label: "Khôi phục",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== BÀI VIẾT =====
      {
        id: 11,
        title: "Quản lý bài viết",
        name: "Thêm bài viết",
        label: "Thêm",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 12,
        title: "Quản lý bài viết",
        name: "Sửa bài viết",
        label: "Sửa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 13,
        title: "Quản lý bài viết",
        name: "Xóa bài viết",
        label: "Xóa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 14,
        title: "Quản lý bài viết",
        name: "Xem bài viết",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== VAI TRÒ =====
      {
        id: 16,
        title: "Quản lý vai trò",
        name: "Thêm vai trò",
        label: "Thêm",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 17,
        title: "Quản lý vai trò",
        name: "Sửa vai trò",
        label: "Sửa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 18,
        title: "Quản lý vai trò",
        name: "Xóa vai trò",
        label: "Xóa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 19,
        title: "Quản lý vai trò",
        name: "Xem vai trò",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== TÀI KHOẢN =====
      {
        id: 21,
        title: "Quản lý tài khoản",
        name: "Thêm tài khoản",
        label: "Thêm",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 22,
        title: "Quản lý tài khoản",
        name: "Sửa tài khoản",
        label: "Sửa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 23,
        title: "Quản lý tài khoản",
        name: "Xóa tài khoản",
        label: "Xóa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 24,
        title: "Quản lý tài khoản",
        name: "Xem tài khoản",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== THỐNG KÊ =====
      {
        id: 25,
        title: "Quản lý thống kê",
        name: "Xem thống kê",
        label: "Xem thống kê",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== KHUYẾN MÃI =====
      {
        id: 26,
        title: "Quản lý khuyến mãi",
        name: "Thêm mã khuyến mãi",
        label: "Thêm",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 27,
        title: "Quản lý khuyến mãi",
        name: "Sửa mã khuyến mãi",
        label: "Sửa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 28,
        title: "Quản lý khuyến mãi",
        name: "Xóa mã khuyến mãi",
        label: "Xóa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 29,
        title: "Quản lý khuyến mãi",
        name: "Xem mã khuyến mãi",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== DANH MỤC BÀI VIẾT =====
      {
        id: 31,
        title: "Quản lý danh mục bài viết",
        name: "Thêm danh mục bài viết",
        label: "Thêm",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 32,
        title: "Quản lý danh mục bài viết",
        name: "Sửa danh mục bài viết",
        label: "Sửa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 33,
        title: "Quản lý danh mục bài viết",
        name: "Xóa danh mục bài viết",
        label: "Xóa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 34,
        title: "Quản lý danh mục bài viết",
        name: "Xem danh mục bài viết",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== PHÂN QUYỀN =====
      {
        id: 36,
        title: "Quản lý phân quyền",
        name: "Phân quyền",
        label: "Phân quyền",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== BÌNH LUẬN BLOG =====
      {
        id: 58,
        title: "Quản lý bình luận blog",
        name: "Xóa bình luận bài viết",
        label: "Xóa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 59,
        title: "Quản lý bình luận blog",
        name: "Xem bình luận bài viết",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== BÀN ĂN =====
      {
        id: 60,
        title: "Quản lý bàn ăn",
        name: "Thêm bàn ăn",
        label: "Thêm",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 61,
        title: "Quản lý bàn ăn",
        name: "Sửa bàn ăn",
        label: "Sửa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 62,
        title: "Quản lý bàn ăn",
        name: "Xóa bàn ăn",
        label: "Xóa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 63,
        title: "Quản lý bàn ăn",
        name: "Xem bàn ăn",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== ĐẶT BÀN =====
      {
        id: 65,
        title: "Quản lý đặt bàn",
        name: "Thêm đặt bàn",
        label: "Thêm",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 66,
        title: "Quản lý đặt bàn",
        name: "Sửa đặt bàn",
        label: "Sửa",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 67,
        title: "Quản lý đặt bàn",
        name: "Xem chi tiết đặt bàn",
        label: "Xem chi tiết",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 68,
        title: "Quản lý đặt bàn",
        name: "Xem đặt bàn",
        label: "Xem",
        created_at: new Date(),
        updated_at: new Date(),
      },

      // ===== CHAT =====
      {
        id: 70,
        title: "Quản lý chat",
        name: "Tư vấn khách hàng",
        label: "Chat khách hàng",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("permissions", null, {});
  },
};
